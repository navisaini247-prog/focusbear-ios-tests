import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { BodyLargeText, DisplayMediumText } from "@/components/Text";
import { Button, Group, HeadingWithInfo, MenuItemFlatlist } from "@/components";
import { PermissionWarningModal } from "@/components/PermissionWarningModal";
import { MenuItemProps } from "@/components/MenuItem";

import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import { navigate, navigateBack } from "../../navigation/root.navigator";
import { NAVIGATION } from "@/constants";
import { useRoute, useTheme } from "@react-navigation/native";
import DatePicker from "react-native-date-picker";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { setCutOffTime } from "@/actions/RoutineActions";
import { getSplitTime } from "@/utils/TimeMethods";
import { cutOffTimeSelector } from "@/selectors/RoutineSelectors";
import { useHomeContext } from "../Home/context";
import { AppActivationStatus, useParticipantCode } from "@/hooks/useParticipantCode";

// Add HomeContextType for type safe
interface HomeContextType {
  isHealthPermissionGranted: boolean;
  isPhysicalPermissionGranted: boolean;
  requestPermission: () => void;
  requestPhysicalActivityPermission: () => void;
  isUsagePermissionGranted: boolean;
  isScreenTimePermissionGranted: boolean;
  requestScreenTimePermission: () => void;
  isPhysicalActivityPermissionDisabled: boolean;
}

const PermissionRequestScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const cutOffTime = useSelector(cutOffTimeSelector);

  const [isShowPermissionWarningModal, setIsShowPermissionWarningModal] = useState(false);
  const [showPermissionWarningFor, setShowPermissionWarningFor] = useState("");
  const [codeActivationStatus, setCodeActivationStatus] = useState<AppActivationStatus | null>(null);
  const { getCodeActivationStatus } = useParticipantCode();
  const route = useRoute() as {
    params: {
      fromUnicaesOnboarding: boolean;
    };
  };
  const fromUnicaesOnboarding = route.params?.fromUnicaesOnboarding;

  const {
    isHealthPermissionGranted,
    isPhysicalPermissionGranted,
    requestPermission,
    requestPhysicalActivityPermission,
    isUsagePermissionGranted,
    isScreenTimePermissionGranted,
    requestScreenTimePermission,
    isPhysicalActivityPermissionDisabled,
  } = useHomeContext() as HomeContextType;

  useEffect(() => {
    getCodeActivationStatus().then((data) => {
      setCodeActivationStatus(data);
    });
  }, []);

  const usagePermission: MenuItemProps[] = checkIsAndroid()
    ? [
        {
          title: t("settings.usage_permission"),
          subtitle: isUsagePermissionGranted ? t("settings.allowed") : t("settings.notGrantedYet"),
          isWarning: !isUsagePermissionGranted,
          hideChevron: !isUsagePermissionGranted,
          onPress: () => {
            setShowPermissionWarningFor(t("home.usagePermission"));
            setIsShowPermissionWarningModal(true);
          },
          icon: "pie-chart",
        },
        {
          title: t("settings.healthAndSleepPermission"),
          subtitle: isHealthPermissionGranted ? t("settings.allowed") : t("settings.notGrantedYet"),
          isWarning: !isHealthPermissionGranted,
          hideChevron: !isHealthPermissionGranted,
          onPress: requestPermission,
          icon: "google-fit",
          iconType: "MaterialCommunityIcons",
        },
        // Only include physical activity permission if not disabled
        ...(!isPhysicalActivityPermissionDisabled
          ? [
              {
                title: t("settings.physicalActivityPermission"),
                subtitle: isPhysicalPermissionGranted ? t("settings.allowed") : t("settings.notGrantedYet"),
                isWarning: !isPhysicalPermissionGranted,
                hideChevron: !isPhysicalPermissionGranted,
                onPress: requestPhysicalActivityPermission,
                icon: "running",
                iconType: "FontAwesome5",
              } as MenuItemProps,
            ]
          : []),
      ]
    : [
        {
          title: t("settings.healthPermission"),
          subtitle: isHealthPermissionGranted ? t("settings.allowed") : t("settings.notGrantedYet"),
          isWarning: !isHealthPermissionGranted,
          hideChevron: !isHealthPermissionGranted,
          onPress: requestPermission,
          icon: "google-fit",
          iconType: "MaterialCommunityIcons",
        },
        {
          title: t("settings.screen_time_permission"),
          subtitle: isScreenTimePermissionGranted ? t("settings.allowed") : t("settings.notAllowed"),
          isWarning: !isScreenTimePermissionGranted,
          hideChevron: !isScreenTimePermissionGranted,
          onPress: () => requestScreenTimePermission(),
          icon: "hourglass",
        },
      ];

  const handlePress = () => {
    const hours = time.getHours().toString().padStart(2, "0");
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const formattedNextTime = `${hours}:${minutes}`;
    dispatch(setCutOffTime(formattedNextTime || "22:00"));

    if (fromUnicaesOnboarding) {
      navigateBack();
      return;
    }

    if (codeActivationStatus === AppActivationStatus.DATA_COLLECTION_MODE) {
      navigate(NAVIGATION.DataCollectionOnly, {});
    } else {
      navigate(NAVIGATION.TabNavigator, {});
    }
  };

  const shouldDisableButton = checkIsAndroid()
    ? !isUsagePermissionGranted ||
      !isHealthPermissionGranted ||
      (!isPhysicalActivityPermissionDisabled && !isPhysicalPermissionGranted)
    : !isHealthPermissionGranted || !isScreenTimePermissionGranted;

  const [time, setTime] = useState(new Date());
  const pickerFadeToColor = colors.background;

  const closeTime = (selectedValue) => {
    setTime(selectedValue);
  };

  const setDefaultTime = () => {
    const { hours, min } = getSplitTime(cutOffTime);

    setTime((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setHours(hours || 22);
      newDate.setMinutes(min || 0);
      return newDate;
    });
  };

  useEffect(() => {
    setDefaultTime();
  }, []);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <DisplayMediumText center>{t("participantCode.permissionNeededTitle")}</DisplayMediumText>
      <View style={styles.subContainer}>
        <BodyLargeText center style={styles.description}>
          {t("participantCode.permissionNeededDescription")}
        </BodyLargeText>
        <Group>
          <MenuItemFlatlist data={usagePermission} />
        </Group>

        {checkIsAndroid() && (
          <View style={styles.timeSubContainer}>
            <HeadingWithInfo
              center
              style={styles.timeDescription}
              infoText={t("participantCode.whatTimeDoYouSleepDescription")}
            >
              {t("participantCode.whatTimeDoYouGoToSleep")}
            </HeadingWithInfo>
            <View style={[styles.timeContainer, { borderColor: colors.separator, backgroundColor: colors.background }]}>
              <DatePicker
                mode="time"
                date={time}
                onDateChange={(selectedTime) => closeTime(selectedTime)}
                androidVariant="iosClone"
                fadeToColor={pickerFadeToColor}
              />
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            primary
            title={t("participantCode.continue")}
            disabled={shouldDisableButton}
            onPress={handlePress}
            testID="test:id/continue-permission-button"
          />
        </View>
        <PermissionWarningModal
          isShowPermissionWarningModal={isShowPermissionWarningModal}
          setisShowPermissionWarningModal={setIsShowPermissionWarningModal}
          showPermissionWarningFor={showPermissionWarningFor}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  timeSubContainer: { flex: 1, justifyContent: "flex-end" },
  subContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  description: {
    marginBottom: 30,
    marginTop: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 16,
    flex: checkIsIOS() ? 1 : 0,
    justifyContent: "flex-end",
  },
  timeDescription: {
    marginBottom: 16,
    marginTop: 16,
  },
  timeContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
  },
});

export { PermissionRequestScreen };
