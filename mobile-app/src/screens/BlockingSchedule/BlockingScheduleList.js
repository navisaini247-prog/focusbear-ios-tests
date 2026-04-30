import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import PropTypes from "prop-types";
import { DeviceEventEmitter, Platform, StyleSheet, View } from "react-native";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BodySmallText, HeadingMediumText, HeadingSmallText, FullPageLoading, MenuItem, Group } from "@/components";
import { BigHeaderScrollView } from "@/components";
import { AddBlockButton } from "./components/AddBlockButton";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { ControlFunctionModule, BlockingScheduleModule } from "@/nativeModule";
import { ChooseAppsButton } from "./components/ChooseAppsButton";
import { ExistingSchedulesList } from "./components/ExistingSchedulesList";
import { BlockingPermissionMenu } from "../Permissions/Permissions";
import { NAVIGATION } from "@/constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHomeContext } from "../Home/context";
import { useSelector } from "@/reducers";
import { userSelector } from "@/selectors/UserSelectors";
import { getBlockedAppsCountFromIOS, getGlobalHabitBlockingEnabledNativeMethod } from "@/utils/NativeModuleMethods";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { setBlockedAppsCountFromIOS } from "@/actions/GlobalActions";
import { useDispatch } from "react-redux";

const isIOS = Platform.OS === "ios";
const isAndroid = Platform.OS === "android";

export const BlockingScheduleList = ({ navigation }) => {
  const {
    isScreenTimePermissionGranted,
    isUsagePermissionGranted,
    isOverlayPermissionGranted,
    isRequestingScreenTimePermission,
  } = useHomeContext();

  const dispatch = useDispatch();

  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [isSchedulesLoading, setIsSchedulesLoading] = useState(false);
  const [isGlobalHabitBlockingEnabled, setIsGlobalHabitBlockingEnabled] = useState(true);
  const [globalSelectionCounts, setGlobalSelectionCounts] = useState(null);

  const user = useSelector(userSelector) || {};
  const { userLocalDeviceSettingsData } = user;
  const androidGlobalBlockedApps = userLocalDeviceSettingsData?.Android?.always_blocked_apps || [];

  const { allSchedules, isSyncing, syncSchedules } = useHomeContext();

  const isRefreshingRef = useRef(false);

  const refreshSchedules = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }
    isRefreshingRef.current = true;
    try {
      setIsSchedulesLoading(true);
      await syncSchedules();
    } catch (error) {
      console.warn("[BlockingScheduleList] Unable to load schedules", error);
    } finally {
      setIsSchedulesLoading(false);
      isRefreshingRef.current = false;
    }
  }, [syncSchedules]);

  const schedules = useMemo(
    () => (Array.isArray(allSchedules) ? allSchedules : []).filter((schedule) => schedule?.type !== "habit"),
    [allSchedules],
  );

  const loadGlobalHabitBlockingEnabled = useCallback(async () => {
    try {
      const enabled = await getGlobalHabitBlockingEnabledNativeMethod();
      if (enabled === null) {
        return;
      }
      setIsGlobalHabitBlockingEnabled(Boolean(enabled));
    } catch (error) {
      console.warn("[BlockingScheduleList] Unable to load global habit blocking enabled", error);
    }
  }, []);

  const updateGlobalSelectionCounts = useCallback(() => {
    if (!isIOS || !ControlFunctionModule?.getGlobalHabitBlockingSelection) {
      return;
    }
    try {
      ControlFunctionModule.getGlobalHabitBlockingSelection((result) => {
        const counts = Array.isArray(result) ? result[0] : result;
        const { applicationsCount = 0, categoriesCount = 0, webDomainsCount = 0 } = counts || {};
        setGlobalSelectionCounts({ applicationsCount, categoriesCount, webDomainsCount });
      });
    } catch (error) {
      console.warn("[BlockingScheduleList] Unable to refresh global selection counts", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isIOS) {
        if (!isScreenTimePermissionGranted) {
          return;
        }
        refreshSchedules();
        loadGlobalHabitBlockingEnabled();
        if (isGlobalHabitBlockingEnabled) {
          updateGlobalSelectionCounts();
        }
        return;
      } else {
        loadGlobalHabitBlockingEnabled();
      }

      refreshSchedules();
    }, [
      isScreenTimePermissionGranted,
      refreshSchedules,
      loadGlobalHabitBlockingEnabled,
      isGlobalHabitBlockingEnabled,
      updateGlobalSelectionCounts,
    ]),
  );

  useEffect(() => {
    if (isIOS) {
      const subscription = DeviceEventEmitter.addListener("onGlobalSelectionChanged", (payload = {}) => {
        const applicationsCount = payload.applicationsCount ?? 0;
        const categoriesCount = payload.categoriesCount ?? 0;
        const webDomainsCount = payload.webDomainsCount ?? 0;

        if (!isGlobalHabitBlockingEnabled) {
          return;
        }

        setGlobalSelectionCounts({ applicationsCount, categoriesCount, webDomainsCount });
      });

      return () => {
        subscription.remove();
      };
    }

    if (isAndroid) {
      const subscription = DeviceEventEmitter.addListener("onBlockingStatusChanged", () => {
        refreshSchedules();
      });
      return () => {
        subscription.remove();
      };
    }
  }, [isGlobalHabitBlockingEnabled, refreshSchedules]);

  const handleSchedulePress = useCallback(
    (schedule) => {
      postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_SCHEDULE_SCREEN_OPENED, { mode: "edit" });
      navigation?.navigate(NAVIGATION.BlockingSchedule, { schedule });
    },
    [navigation],
  );

  const handleAddSchedule = useCallback(() => {
    postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_SCHEDULE_ADD_NEW);
    navigation?.navigate(NAVIGATION.BlockingSchedule);
  }, [navigation]);

  const handleCustomizeFocusShield = useCallback(() => {
    navigation?.navigate(NAVIGATION.CustomizeBlocking);
  }, [navigation]);

  const handleToggleGlobalHabitBlocking = useCallback(async () => {
    const newValue = !isGlobalHabitBlockingEnabled;
    try {
      setIsGlobalHabitBlockingEnabled(newValue);
      if (isIOS) {
        ControlFunctionModule.setGlobalHabitBlockingEnabled(newValue);
      } else if (isAndroid && BlockingScheduleModule?.setGlobalHabitBlockingEnabled) {
        await BlockingScheduleModule.setGlobalHabitBlockingEnabled(newValue);
      }
      postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_SCHEDULE_TOGGLE_GLOBAL, { enabled: newValue });
      if (newValue) {
        updateGlobalSelectionCounts();
      } else {
        setGlobalSelectionCounts(null);
      }
    } catch (error) {
      console.warn("[BlockingScheduleList] Failed to toggle global habit blocking", error);
    }
  }, [isGlobalHabitBlockingEnabled, updateGlobalSelectionCounts]);

  const handleChooseAppsForGlobalHabitBlocking = useCallback(() => {
    try {
      postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_SCHEDULE_SELECT_APPS_GLOBAL);
      if (isIOS) {
        ControlFunctionModule.selectAppsForGlobalHabitBlocking();
      } else {
        navigation.navigate(NAVIGATION.AppsBlockList);
      }
    } catch (error) {
      console.warn("[BlockingScheduleList] Failed to select apps for global habit blocking", error);
    }
  }, [navigation]);

  const hasRequiredPermissions = isIOS
    ? isScreenTimePermissionGranted
    : isUsagePermissionGranted && isOverlayPermissionGranted;

  useEffect(() => {
    const fetchBlockedAppsCount = async () => {
      if (checkIsIOS()) {
        const blockedAppsCountData = await getBlockedAppsCountFromIOS();
        dispatch(setBlockedAppsCountFromIOS(blockedAppsCountData));
      }
    };

    fetchBlockedAppsCount();
  }, [dispatch]);

  return (
    <View style={styles.flex}>
      <BigHeaderScrollView
        title={t("blockingSchedule.title")}
        contentContainerStyle={[styles.bodyContainer, styles.gap24, { paddingBottom: insets.bottom + 12 }]}
      >
        {!hasRequiredPermissions ? (
          <View style={styles.gap12}>
            <View style={styles.gap8}>
              <HeadingMediumText>{t("blockingSchedule.permissionsRequired")}</HeadingMediumText>
              <HeadingSmallText color={colors.subText}>
                {t(`blockingSchedule.${isIOS ? "iOS" : "android"}PermissionDescription`)}
              </HeadingSmallText>
            </View>

            <BlockingPermissionMenu showCheckmark />
          </View>
        ) : (
          <>
            <Group>
              <MenuItem
                title={t("blockingSchedule.blockAllDuringHabits")}
                type="switch"
                isSelected={isGlobalHabitBlockingEnabled}
                onPress={handleToggleGlobalHabitBlocking}
              />
              {isGlobalHabitBlockingEnabled && (
                <ChooseAppsButton
                  selectionCounts={globalSelectionCounts}
                  selectedApps={androidGlobalBlockedApps}
                  testID="test:id/choose-apps-for-global-habit-blocking"
                  onPress={handleChooseAppsForGlobalHabitBlocking}
                />
              )}
              <MenuItem title={t("blockingSchedule.customizeBlocking")} onPress={handleCustomizeFocusShield} />
            </Group>

            <View style={styles.gap12}>
              <HeadingMediumText>{t("blockingSchedule.scheduledBlocksTitle")}</HeadingMediumText>

              {schedules.length === 0 ? (
                <BodySmallText color={colors.subText}>{t("blockingSchedule.scheduledBlocksInfoText")}</BodySmallText>
              ) : (
                <ExistingSchedulesList schedules={schedules} onSchedulePress={handleSchedulePress} />
              )}

              <AddBlockButton onPress={handleAddSchedule} testID="test:id/add-blocking-schedule-inline" />
            </View>
          </>
        )}
      </BigHeaderScrollView>
      <FullPageLoading show={isRequestingScreenTimePermission || isSchedulesLoading || isSyncing} />
    </View>
  );
};

BlockingScheduleList.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap24: { gap: 24 },
  bodyContainer: {
    padding: 16,
  },
});
