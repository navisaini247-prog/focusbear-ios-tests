/* eslint-disable react-hooks/rules-of-hooks */
import React, { memo } from "react";
import { TouchableOpacity, View, Alert } from "react-native";
import { Image } from "react-native";
import { useLauncherContext } from "../../context";
import Icon from "react-native-vector-icons/FontAwesome";
import COLOR from "@/constants/color";
import { useSelector } from "@/reducers";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useHomeContext } from "@/screens/Home/context";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { launcherAppLabelSelector } from "@/selectors/GlobalSelectors";
import { isEmpty } from "lodash";
import { BodySmallText } from "@/components";

export const AppItem = memo(function AppItem({ packageName, appName, label, icon, accentColor: _accentColor }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (checkIsIOS()) {
    return null;
  }

  const { launchApplication, styles, setOpenSetAppLabel, setSelectedLabellingApp } = useLauncherContext();

  const { isBlocking, isScheduleBlocking, onPressPostpone } = useHomeContext();

  const launcherAppLabels = useSelector(launcherAppLabelSelector);

  const { userLocalDeviceSettingsData } = useSelector((state) => state.user);

  const blockedAppsOnServer = userLocalDeviceSettingsData?.Android?.always_blocked_apps ?? [];

  const isAppBlocked = blockedAppsOnServer?.includes(packageName);

  // Handle both enhanced format (label) and legacy format (appName)
  const displayName = label || appName;

  const onLaunchApp = async () => {
    if (isAppBlocked && (isBlocking || isScheduleBlocking)) {
      await Alert.alert(
        t("launcher.restricted"),
        t("launcher.restrictedMessage", { appName: displayName }),
        [
          {
            text: t("launcher.stopBlocking"),
            onPress: () => onPressPostpone({ pendingAppLaunch: packageName }),
          },
          { text: t("common.ok") },
        ],
        { cancelable: false },
      );
    } else {
      launchApplication(packageName);
    }
  };

  const onSetLabel = () => {
    setSelectedLabellingApp({ packageName, appName: displayName });
    setOpenSetAppLabel(true);
  };

  return (
    <TouchableOpacity
      style={styles.appItemContainer}
      onPress={() => onLaunchApp()}
      testID={`test:id/app-launch-${packageName}`}
    >
      <View style={styles.appIconContainer}>
        <Image
          source={{
            uri: icon?.startsWith("file://")
              ? icon // Enhanced format: file path
              : "data:image/png;base64," + icon, // Legacy format: base64
          }}
          style={styles.image_style}
        />
        {isAppBlocked && (isBlocking || isScheduleBlocking) ? (
          <View style={styles.lockedApp}>
            <Icon name="lock" size={25} color={COLOR.WHITE} />
          </View>
        ) : null}
      </View>
      <View style={styles.itemNameContainer}>
        <BodySmallText style={styles.itemLabel}>
          {`${displayName} ${
            isAppBlocked && (isBlocking || isScheduleBlocking) ? `(${t("launcher.restricted")})` : ""
          }`}
        </BodySmallText>
        <TouchableOpacity onPress={onSetLabel} testID={`test:id/app-set-label-${packageName}`}>
          <Icon name={isEmpty(launcherAppLabels?.[packageName]) ? "star-o" : "star"} size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});
