import React, { createContext, useCallback, useMemo, useEffect, useRef } from "react";
import { INDEFINITE } from "@/modals/PostponeModal";
import {
  setPostponeActivated,
  setPostponeDuration,
  setPostponeStartTime,
  incrementPostponeCount,
} from "@/actions/GlobalActions";
import { useShouldEnableDistractionBlocking } from "@/hooks/use-enable-distraction-blocking";
import { NOTIFICATION_ID, NOTIFICATION_PRESS_ID, POSTHOG_EVENT_NAMES, POSTHOG_PERSON_PROPERTIES } from "@/utils/Enums";
import { addInfoLog } from "@/utils/FileLogger";
import {
  resumeBlockingAfterPostponeDuration,
  pauseBlockingWithResumeNativeMethod,
  pauseBlockingSchedulesIndefinitelyNativeMethod,
  resumeBlockingSchedulesNativeMethod,
  updateScheduleBlockingStatus,
} from "@/utils/NativeModuleMethods";
import { postHogCapture, posthogSetProperties } from "@/utils/Posthog";
import { useDispatch } from "react-redux";
import { createTriggerNotification } from "../Notification";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { BEARSONAS, NAVIGATION } from "@/constants";
import { useSelector } from "@/reducers";
import { useBlockingPermission } from "@/hooks/use-blocking-permission";
import { bearsonaNameSelector, userIdSelector } from "@/selectors/UserSelectors";
import { useToggleDnd } from "@/hooks/use-toggle-dnd";
import { useToggleFrictionMode } from "./hooks/use-toggle-friction-mode";
import useCheckBlockedAppsStatus from "@/hooks/use-check-allowed-blocked-apps";
import { useHealthPermission } from "@/hooks/use-health-permission";
import { hidePostponeModal, showPostponeModal, showPasswordModal } from "@/actions/ModalActions";
import { pendingAppLaunchSelector } from "@/selectors/ModalSelectors";
import { postponeActivatedStatusSelector } from "@/selectors/GlobalSelectors";
import { useIsPasswordRequired } from "./hooks/use-is-password-required";
import { getIsMorningOrEvening } from "@/utils/ActivityRoutineMethods";
import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import { InteractionManager } from "react-native";
import { LauncherKit } from "@/nativeModule";
import useSyncBlockingSchedules from "../BlockingSchedule/hooks/useSyncBlockingSchedules";
import { useCalendarPermission } from "@/hooks/use-calendar-permission";
import { useSyncSoftBlockSettings } from "./hooks/use-sync-soft-block-settings";
import { useRoutineData } from "@/hooks/use-routine-data";

const Context = createContext({});

const HomeContextProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const bearsonaName = useSelector(bearsonaNameSelector);
  const pendingAppLaunch = useSelector(pendingAppLaunchSelector);
  const isPostponeActivated = useSelector(postponeActivatedStatusSelector);

  const routineData = useRoutineData();

  const isPasswordRequired = useIsPasswordRequired(getIsMorningOrEvening());
  const isPhysicalActivityPermissionDisabled = useSelector(
    (state) => state.global.isPhysicalActivityPermissionDisabled,
  );
  const userId = useSelector(userIdSelector);

  const { allSchedules, isSyncing, syncSchedules } = useSyncBlockingSchedules();

  const isUnicasStudyParticipant = false;

  const {
    isUsagePermissionGranted,
    isOverlayPermissionGranted,
    isPushNotificationPermissionGranted,
    isScreenTimePermissionGranted,
    isDNDPermissionGranted,
    isIgnoredBatteryPermissionGranted,
    isAccessibilityPermissionGranted,
    requestUsagePermission,
    requestOverlayPermission,
    requestScreenTimePermission,
    revokeScreenTimePermission,
    allBlockingPermissionsGranted,
    ignoreBatteryOptimization,
    requestAccessibilityPermission,
    isRequestingScreenTimePermission,
  } = useBlockingPermission();

  const {
    isHealthPermissionGranted,
    isPhysicalPermissionGranted,
    requestPermission,
    requestPhysicalActivityPermission,
    checkPermission,
    revokePermission,
  } = useHealthPermission();

  const { isCalendarPermissionGranted, requestCalendarPermission, checkCalendarPermission } = useCalendarPermission();

  const { hasUserSelectedAnyApp, loading: hasUserSelectedAppCheckLoading } = useCheckBlockedAppsStatus();

  const showBlockedAppsWarning = useMemo(
    () => !hasUserSelectedAnyApp && !hasUserSelectedAppCheckLoading,
    [hasUserSelectedAnyApp, hasUserSelectedAppCheckLoading],
  );

  const { reason, blockingReasonKey, isBlocking, refreshDistractionBlocking } = useShouldEnableDistractionBlocking({
    isOverlayPermissionGranted,
    isUsagePermissionGranted,
    allBlockingPermissionsGranted,
  });

  useToggleDnd(isDNDPermissionGranted);
  useToggleFrictionMode();
  useSyncSoftBlockSettings();

  const onPressPostpone = useCallback(
    ({ pendingAppLaunch } = {}) => {
      if (isPasswordRequired) {
        addInfoLog(`User pressed postpone, password required`);
        dispatch(showPasswordModal({ onPasswordVerified: () => dispatch(showPostponeModal({ pendingAppLaunch })) }));
      } else {
        addInfoLog(`User pressed postpone`);
        dispatch(showPostponeModal({ pendingAppLaunch }));
      }
    },
    [isPasswordRequired],
  );

  const postponeBlocking = useCallback(
    async (duration) => {
      if (duration !== INDEFINITE) {
        // Calculate hours and minutes from duration (in milliseconds)
        const totalMinutes = Math.floor(duration / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        // Create reason string for DeviceActivity
        const reason = `pause_resume_${Date.now()}`;

        // Call native pause with resume scheduling
        pauseBlockingWithResumeNativeMethod(hours, minutes, reason);

        await updateScheduleBlockingStatus();

        createTriggerNotification({
          id: NOTIFICATION_ID.ROUTINE,
          timestamp: Date.now() + duration,
          title: t("notification.scheduleNotificationTitleForResumeRoutine"),
          body: t("notification.scheduleNotificationDescriptionForResumeRoutine"),
          pressActionId: NOTIFICATION_PRESS_ID.RESUME_ROUTINE,
        });
        postHogCapture(POSTHOG_EVENT_NAMES.POSTPONE_HABIT);
        addInfoLog(`User postponed routine for ${duration / 60 / 1000} mins with native resume scheduling`);
        resumeBlockingAfterPostponeDuration(duration);
      } else {
        addInfoLog(`User deactivated blocking`);
        if (checkIsIOS()) {
          pauseBlockingSchedulesIndefinitelyNativeMethod();
        }
        pauseBlockingWithResumeNativeMethod(99, 0, reason);

        await updateScheduleBlockingStatus();
      }

      if (pendingAppLaunch && checkIsAndroid()) {
        LauncherKit.launchApplication(pendingAppLaunch);
      }

      dispatch(hidePostponeModal());

      InteractionManager.runAfterInteractions(() => {
        dispatch(setPostponeStartTime(Date.now()));
        dispatch(setPostponeDuration(duration));
        dispatch(setPostponeActivated(true));
        dispatch(incrementPostponeCount());
        navigation.navigate(NAVIGATION.TabNavigator);
      });
    },
    [pendingAppLaunch, dispatch],
  );

  const previousPostponeStateRef = useRef(isPostponeActivated);

  useEffect(() => {
    if (checkIsIOS() && previousPostponeStateRef.current && !isPostponeActivated) {
      (async () => {
        resumeBlockingSchedulesNativeMethod();
        await updateScheduleBlockingStatus();
      })();
    }
    previousPostponeStateRef.current = isPostponeActivated;
  }, [isPostponeActivated]);

  const bearsona = useMemo(
    () =>
      BEARSONAS.find((bearsona) => bearsona.name === bearsonaName) ||
      BEARSONAS.find((bearsona) => bearsona.name === "default"),
    [bearsonaName],
  );

  useEffect(() => {
    if (isOverlayPermissionGranted) {
      postHogCapture(POSTHOG_EVENT_NAMES.ACTIVATED_PERMISSION_OVERLAY);
      posthogSetProperties(userId, { [POSTHOG_PERSON_PROPERTIES.PERMISSION_OVERLAY_ACTIVE]: true });
    }
    if (isUsagePermissionGranted) {
      postHogCapture(POSTHOG_EVENT_NAMES.ACTIVATED_PERMISSION_USAGE_ACCESS);
      posthogSetProperties(userId, { [POSTHOG_PERSON_PROPERTIES.PERMISSION_USAGE_ACCESS_ACTIVE]: true });
    }
    if (isScreenTimePermissionGranted && !checkIsAndroid()) {
      postHogCapture(POSTHOG_EVENT_NAMES.ACTIVATED_PERMISSION_SCREEN_TIME);
      posthogSetProperties(userId, { [POSTHOG_PERSON_PROPERTIES.PERMISSION_SCREENTIME_ACTIVE]: true });
    }
    if (isPushNotificationPermissionGranted) {
      postHogCapture(POSTHOG_EVENT_NAMES.ACTIVATED_PERMISSION_NOTIFICATIONS);
      posthogSetProperties(userId, { [POSTHOG_PERSON_PROPERTIES.PERMISSION_NOTIFICATIONS_ACTIVE]: true });
    }
  }, [
    isOverlayPermissionGranted,
    isUsagePermissionGranted,
    isScreenTimePermissionGranted,
    isPushNotificationPermissionGranted,
  ]);

  const value = useMemo(() => {
    return {
      blockingReason: reason,
      blockingReasonKey,
      isBlocking,
      onPressPostpone,
      postponeBlocking,
      bearsona: bearsona,
      refreshDistractionBlocking,
      isUsagePermissionGranted,
      isOverlayPermissionGranted,
      isPushNotificationPermissionGranted,
      isScreenTimePermissionGranted,
      isDNDPermissionGranted,
      isIgnoredBatteryPermissionGranted,
      requestUsagePermission,
      requestOverlayPermission,
      requestScreenTimePermission,
      revokeScreenTimePermission,
      allBlockingPermissionsGranted,
      ignoreBatteryOptimization,
      showBlockedAppsWarning,
      isAccessibilityPermissionGranted,
      requestAccessibilityPermission,
      isRequestingScreenTimePermission,
      isUnicasStudyParticipant,
      isHealthPermissionGranted,
      isPhysicalPermissionGranted: isPhysicalPermissionGranted || !isPhysicalActivityPermissionDisabled,
      requestPermission,
      requestPhysicalActivityPermission,
      checkPermission,
      revokePermission,
      isPhysicalActivityPermissionDisabled,
      isCalendarPermissionGranted,
      requestCalendarPermission,
      checkCalendarPermission,
      allSchedules,
      isSyncing,
      syncSchedules,
      isPasswordRequired,
      routineData,
    };
  }, [
    reason,
    blockingReasonKey,
    isBlocking,
    onPressPostpone,
    postponeBlocking,
    bearsona,
    refreshDistractionBlocking,
    isUsagePermissionGranted,
    isOverlayPermissionGranted,
    isPushNotificationPermissionGranted,
    isScreenTimePermissionGranted,
    isDNDPermissionGranted,
    isIgnoredBatteryPermissionGranted,
    requestUsagePermission,
    requestOverlayPermission,
    requestScreenTimePermission,
    revokeScreenTimePermission,
    allBlockingPermissionsGranted,
    ignoreBatteryOptimization,
    showBlockedAppsWarning,
    isAccessibilityPermissionGranted,
    requestAccessibilityPermission,
    isRequestingScreenTimePermission,
    isUnicasStudyParticipant,
    isHealthPermissionGranted,
    isPhysicalPermissionGranted,
    isPhysicalActivityPermissionDisabled,
    requestPermission,
    requestPhysicalActivityPermission,
    checkPermission,
    revokePermission,
    isPhysicalActivityPermissionDisabled,
    isCalendarPermissionGranted,
    requestCalendarPermission,
    checkCalendarPermission,
    allSchedules,
    isSyncing,
    syncSchedules,
    isPasswordRequired,
    routineData,
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

const useHomeContext = () => React.useContext(Context);

export { HomeContextProvider, useHomeContext };
