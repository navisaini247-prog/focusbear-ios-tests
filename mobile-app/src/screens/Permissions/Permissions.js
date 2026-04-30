import React, { useState } from "react";
import { Linking, View, StyleSheet, Alert } from "react-native";
import { HeadingWithInfo, Group, MenuItem, BodySmallText, FullPageLoading, BigHeaderScrollView } from "@/components";
import Icon from "react-native-vector-icons/Ionicons";
import { PermissionWarningModal } from "@/components/PermissionWarningModal";
import { AccessibilityPermissionModal } from "@/components/AccessibilityPermissionInfoModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { i18n } from "@/localization";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useLauncherContext } from "@/navigation/AppLauncher/context";
import { useHomeContext } from "../Home/context";
import { addInfoLog } from "@/utils/FileLogger";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { useSelector } from "react-redux";
import { isPushNotificationAskedStatusSelector } from "@/selectors/GlobalSelectors";
import { NAVIGATION } from "@/constants";

export const PermissionsScreen = () => {
  const { t } = useTranslation();
  const { isRequestingScreenTimePermission } = useHomeContext();

  return (
    <View style={styles.flex}>
      <BigHeaderScrollView title={t("settings.permissions")} contentContainerStyle={styles.bodyContainer}>
        <SafeAreaView edges={["left", "right", "bottom"]} style={styles.gap32}>
          <View style={styles.gap8}>
            <HeadingWithInfo infoText={checkIsAndroid() && t("permissionExplanation.necessaryPermission")}>
              {t("permissions.blockingAppsGroup")}
            </HeadingWithInfo>
            <BlockingPermissionMenu />
          </View>

          <View style={styles.gap8}>
            <HeadingWithInfo infoText={t("permissions.routineUpdatesGroupDescription")}>
              {t("permissions.routineUpdatesGroup")}
            </HeadingWithInfo>
            <NotificationPermissionMenu />
          </View>

          {checkIsAndroid() && (
            <>
              <View style={styles.gap8}>
                <HeadingWithInfo infoText={t("permissions.urlBlockingGroupDescription")}>
                  {t("permissions.urlBlockingGroup")}
                </HeadingWithInfo>
                <AccessibilityPermissionMenu showIntroModal />
              </View>

              <View style={styles.gap8}>
                <HeadingWithInfo infoText={t("permissions.experimentalDescription")}>
                  {t("permissions.experimentalGroup")}
                </HeadingWithInfo>
                <LauncherPermissionMenu />
              </View>

              <View style={styles.gap8}>
                <HeadingWithInfo infoText={t("permissions.healthGroupDescription")}>
                  {t("permissions.healthGroup")}
                </HeadingWithInfo>
                <HealthPermissionMenu />
              </View>
            </>
          )}
        </SafeAreaView>
      </BigHeaderScrollView>
      <FullPageLoading show={isRequestingScreenTimePermission} />
    </View>
  );
};

const showRevokePermissionAlert = ({ onConfirm }) =>
  Alert.alert(i18n.t("permissions.areYouSure"), i18n.t("permissions.revokePermissionDescription"), [
    { text: i18n.t("common.cancel"), style: "cancel" },
    { text: i18n.t("common.confirm"), style: "destructive", onPress: () => onConfirm && onConfirm() },
  ]);

export const BlockingPermissionMenu = (props) => {
  const { t } = useTranslation();
  const {
    isUsagePermissionGranted,
    isOverlayPermissionGranted,
    isScreenTimePermissionGranted,
    requestScreenTimePermission,
    revokeScreenTimePermission,
  } = useHomeContext();

  const [showPermissionWarningFor, setShowPermissionWarningFor] = useState(t("home.usagePermission"));
  const [isShowPermissionWarningModal, setIsShowPermissionWarningModal] = useState(false);

  return (
    <>
      {checkIsAndroid() ? (
        <Group>
          <PermissionMenuItem
            title={t("settings.usage_permission")}
            isPermissionGranted={isUsagePermissionGranted}
            icon="pie-chart"
            showDot
            onPress={() => {
              postHogCapture(POSTHOG_EVENT_NAMES.REQUEST_USAGE_STATE_PERMISSIONS);
              setShowPermissionWarningFor(t("home.usagePermission"));
              setIsShowPermissionWarningModal(true);
            }}
            {...props}
          />
          <PermissionMenuItem
            title={t("settings.overlay_permission")}
            isPermissionGranted={isOverlayPermissionGranted}
            icon="shield"
            showDot
            onPress={() => {
              postHogCapture(POSTHOG_EVENT_NAMES.REQUEST_OVERLAY_PERMISSIONS);
              setShowPermissionWarningFor(t("home.overlayPermission"));
              setIsShowPermissionWarningModal(true);
            }}
            {...props}
          />
        </Group>
      ) : (
        <PermissionMenuItem
          title={t("settings.screen_time_permission")}
          isPermissionGranted={isScreenTimePermissionGranted}
          icon="hourglass"
          showDot
          onPress={() => {
            if (isScreenTimePermissionGranted) {
              showRevokePermissionAlert({ onConfirm: revokeScreenTimePermission });
            } else {
              postHogCapture(POSTHOG_EVENT_NAMES.REQUEST_SCREEN_TIME_PERMISSIONS);
              requestScreenTimePermission();
            }
          }}
          {...props}
        />
      )}

      {checkIsAndroid() && (
        <PermissionWarningModal
          isShowPermissionWarningModal={isShowPermissionWarningModal}
          showPermissionWarningFor={showPermissionWarningFor}
          setisShowPermissionWarningModal={setIsShowPermissionWarningModal}
        />
      )}
    </>
  );
};

export const NotificationPermissionMenu = (props) => {
  const { t } = useTranslation();
  const isPushNotificationPermissionAsked = useSelector(isPushNotificationAskedStatusSelector);
  const { isPushNotificationPermissionGranted } = useHomeContext();
  const navigation = useNavigation();

  return (
    <PermissionMenuItem
      title={t("settings.notification_permission")}
      isPermissionGranted={isPushNotificationPermissionGranted}
      onPress={() => {
        postHogCapture(POSTHOG_EVENT_NAMES.REQUEST_NOTIFICATION_PERMISSIONS);
        if (!isPushNotificationPermissionAsked) {
          navigation.navigate(NAVIGATION.PushNotificationScreen, { isFromSignin: false });
        } else {
          Linking.openSettings();
        }
      }}
      icon="notifications"
      {...props}
    />
  );
};

export const AccessibilityPermissionMenu = ({ showIntroModal = false, ...props }) => {
  const { t } = useTranslation();
  const { isAccessibilityPermissionGranted, requestAccessibilityPermission } = useHomeContext();
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);

  const handlePress = () => {
    if (showIntroModal) {
      setShowAccessibilityModal(true);
    } else {
      requestAccessibilityPermission();
    }
  };
  return (
    <View>
      <PermissionMenuItem
        title={t("accessibility.title")}
        isPermissionGranted={isAccessibilityPermissionGranted}
        onPress={handlePress}
        icon="accessibility"
        {...props}
      />
      {showIntroModal && (
        <AccessibilityPermissionModal
          isVisible={showAccessibilityModal}
          showIntroModal
          onCancel={() => setShowAccessibilityModal(false)}
          onConfirm={() => {
            setShowAccessibilityModal(false);
            requestAccessibilityPermission();
          }}
        />
      )}
    </View>
  );
};

export const HealthPermissionMenu = (props) => {
  const { t } = useTranslation();
  const {
    isHealthPermissionGranted,
    revokePermission,
    requestPermission,
    isPhysicalPermissionGranted,
    requestPhysicalActivityPermission,
  } = useHomeContext();

  return (
    <Group>
      <PermissionMenuItem
        title={checkIsAndroid() ? t("settings.healthAndSleepPermission") : t("settings.healthPermission")}
        isPermissionGranted={isHealthPermissionGranted}
        icon="google-fit"
        iconType="MaterialCommunityIcons"
        onPress={() => {
          if (isHealthPermissionGranted) {
            showRevokePermissionAlert({ onConfirm: revokePermission });
          } else {
            postHogCapture(POSTHOG_EVENT_NAMES.REQUEST_HEALTH_SLEEP_PERMISSION);
            requestPermission();
          }
        }}
        {...props}
      />
      {checkIsAndroid() && (
        <PermissionMenuItem
          title={t("settings.physicalActivityPermission")}
          isPermissionGranted={isPhysicalPermissionGranted}
          icon="running"
          iconType="FontAwesome5"
          onPress={() => {
            postHogCapture(POSTHOG_EVENT_NAMES.REQUEST_PHYSICAL_ACTIVITY_PERMISSION);
            requestPhysicalActivityPermission();
          }}
          {...props}
        />
      )}
    </Group>
  );
};

const LauncherPermissionMenu = (props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { setAsDefaultLauncher, isFocusBearDefaultLauncher } = useLauncherContext();

  return (
    <PermissionMenuItem
      title={t("launcher.setAsDefaultLauncher")}
      isPermissionGranted={isFocusBearDefaultLauncher}
      icon="home"
      onPress={() => {
        setAsDefaultLauncher();
        if (isFocusBearDefaultLauncher) {
          addInfoLog("Disable Focusbear as Default Launcher");
          postHogCapture(POSTHOG_EVENT_NAMES.LAUNCHER_REQUEST_STOP_BLOCKING);
        }
      }}
      description={<BodySmallText color={colors.danger}>{t("settings.experimental")}</BodySmallText>}
      {...props}
    />
  );
};

const PermissionMenuItem = ({ isPermissionGranted, showDot, showCheckmark, style, ...props }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const isWarning = showDot && !isPermissionGranted;
  const subtitle = (() => {
    if (showCheckmark && isPermissionGranted) {
      return <Icon name={"checkmark-circle"} color={colors.success} size="20" />;
    }
    return isPermissionGranted ? t("settings.allowed") : t("settings.notGrantedYet");
  })();

  return (
    <MenuItem
      big
      isLargeFontScale
      style={[styles.permissionItem, style]}
      isWarning={isWarning}
      subtitle={subtitle}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap8: { gap: 8 },
  gap32: { gap: 32 },
  bodyContainer: {
    padding: 16,
  },
});
