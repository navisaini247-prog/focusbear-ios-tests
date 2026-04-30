import { useDispatch } from "react-redux";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { postponeActivatedStatusSelector, scheduleBlockingStatusSelector } from "@/selectors/GlobalSelectors";
import { focusDurationSelector } from "@/reducers/FocusModeReducer";
import {
  getScheduleBlockingStatusNativeMethod,
  refreshWidgetData,
  startOverlayServiceNativeMethod,
  stopOverlayServiceNativeMethod,
  updateGlobalBlockingEnabledNativeMethod,
} from "@/utils/NativeModuleMethods";
import { cutOffTimeSelector } from "@/selectors/RoutineSelectors";
import { i18n } from "@/localization";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { ROUTINE_NAMES } from "@/constants";
import { addInfoLog } from "@/utils/FileLogger";
import { ControlFunction } from "@/utils/NativeModuleMethods";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { setBlockingReason, setScheduleBlockingStatus } from "@/actions/GlobalActions";
import { useSelector } from "@/reducers";
import { shutDownTimeSelector, startUpTimeSelector } from "@/selectors/RoutineSelectors";
import {
  currentSkippedActivitiesSelector,
  todayRoutineProgressSelector,
  userAccessTokenSelector,
} from "@/selectors/UserSelectors";
import { currentFocusModeFinishTimeSelector } from "@/selectors/UserSelectors";
import { fullRoutineDataSelector } from "@/selectors/RoutineSelectors";
import { calculateIsAnyRoutineActive, calculateIsMorningOrEvening } from "@/utils/ActivityRoutineMethods";
import { getSplitDateTime, isAfterCutOffTime } from "@/utils/TimeMethods";
import { startOverlayListener } from "@/utils/ServiceAndEvents";
import { useTranslation } from "react-i18next";

const GLOBAL_BLOCK_LIST_REASON_KEYS = [
  "focusModeActivated",
  "afterCutoffTimeAndEveningRoutineFinished",
  "afterCutoffTime",
  "otherReason",
  "daytimeBlockingEnabled",
];

export const shouldUseGlobalBlockListForReasonKey = (reasonKey) => {
  if (!reasonKey) {
    return false;
  }
  return GLOBAL_BLOCK_LIST_REASON_KEYS.includes(reasonKey);
};

export const useShouldEnableDistractionBlocking = ({ allBlockingPermissionsGranted }) => {
  const { i18n: translationI18n } = useTranslation();
  const accessToken = useSelector(userAccessTokenSelector);
  const currentFocusModeFinishTime = useSelector(currentFocusModeFinishTimeSelector);
  const dispatch = useDispatch();
  const focusDuration = useSelector(focusDurationSelector);

  const isPostponeActivated = useSelector(postponeActivatedStatusSelector);
  const isInFocusMode = useSelector((state) => state.focusMode.isInFocusMode);
  const todayRoutineProgress = useSelector(todayRoutineProgressSelector);
  const skippedActivities = useSelector(currentSkippedActivitiesSelector);
  const fullRoutineData = useSelector(fullRoutineDataSelector);

  // Old user do not have cutoff_time_for_non_high_priority_activities field, it was set as sleep_time
  const cutOffTime = useSelector(cutOffTimeSelector);
  const shutdownTime = useSelector(shutDownTimeSelector);
  const startupTime = useSelector(startUpTimeSelector);
  const isRoutineActive = useMemo(
    () => calculateIsAnyRoutineActive(fullRoutineData, todayRoutineProgress, skippedActivities),
    [fullRoutineData, skippedActivities, todayRoutineProgress],
  );

  const isDaytimeBlockingEnabled = useSelector(
    (state) => state.user?.userLocalDeviceSettingsData?.MacOS?.kIsDaytimeBlockingEnabled,
  );
  const scheduleBlockingStatus = useSelector(scheduleBlockingStatusSelector);
  const isScheduleBlocking = scheduleBlockingStatus?.isScheduleBlocking ?? false;
  const activeScheduleNamesKey = scheduleBlockingStatus?.activeScheduleNames?.join(",") ?? "";

  const [reason, setReason] = useState("");
  const [blockingReasonKey, setBlockingReasonKey] = useState(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const prevReasonRef = useRef(null);
  const prevIsBlockingRef = useRef(null);
  const overlayRunningRef = useRef(false);
  const prevUseGlobalBlockListRef = useRef(false);

  useEffect(() => {
    startOverlayListener();
  }, []);

  const refreshDistractionBlocking = useCallback(async () => {
    if (checkIsIOS()) {
      try {
        const freshScheduleBlockingStatus = await getScheduleBlockingStatusNativeMethod();
        dispatch(setScheduleBlockingStatus(freshScheduleBlockingStatus));
      } catch (e) {
        addInfoLog(`Failed to check schedule blocking status: ${e?.message ?? e}`);
      }
    }

    const result = checkIfDistractionBlockingShouldBeEnabled({
      accessToken,
      currentFocusModeFinishTime,
      isInFocusMode,
      isUsagePermissionGranted: allBlockingPermissionsGranted,
      isPostponeActivated,
      isDaytimeBlockingEnabled,
      isRoutineActive,
      cutOffTime,
      shutdownTime,
      startupTime,
    });

    const { reason: effectiveReason, shouldEnableBlocking, reasonKey: effectiveReasonKey } = result;

    const useGlobalBlockList = shouldUseGlobalBlockListForReasonKey(effectiveReasonKey);

    const overlayShouldBeRunning = shouldEnableBlocking;

    const reasonChanged = prevReasonRef.current !== effectiveReason;
    const blockingChanged = prevIsBlockingRef.current !== shouldEnableBlocking;
    const overlayStateChanged = overlayRunningRef.current !== overlayShouldBeRunning;
    const shouldUpdateGlobalBlockingFlag =
      overlayShouldBeRunning && overlayRunningRef.current && prevUseGlobalBlockListRef.current !== useGlobalBlockList;

    // Only update state if it changed
    if (reasonChanged) {
      setReason(effectiveReason);
      setBlockingReasonKey(effectiveReasonKey ?? null);
      dispatch(setBlockingReason(effectiveReason));
      if (checkIsIOS()) {
        ControlFunction.setBlockingReason(effectiveReason);
        refreshWidgetData();
      }
    }

    if (blockingChanged) {
      setIsBlocking(shouldEnableBlocking);
      if (checkIsIOS()) {
        ControlFunction.setBlockingStatus(shouldEnableBlocking);
      }
    }

    if (overlayStateChanged) {
      if (overlayShouldBeRunning) {
        const hours = focusDuration?.hours ?? 0;
        const minutes = focusDuration?.minutes ?? 1;

        startOverlayServiceNativeMethod({ hours, minutes, useGlobalBlockList });
        addInfoLog(`Distraction blocking enabled, reason : ${effectiveReason}`);
        postHogCapture(POSTHOG_EVENT_NAMES.BLOCK_DISTRACTION_ENABLED, { reason: effectiveReason });
      } else {
        stopOverlayServiceNativeMethod();
        addInfoLog(`Distraction blocking disabled, reason : ${effectiveReason}`);
        postHogCapture(POSTHOG_EVENT_NAMES.BLOCK_DISTRACTION_DISABLED, { reason: effectiveReason });
      }
    }

    if (shouldUpdateGlobalBlockingFlag) {
      updateGlobalBlockingEnabledNativeMethod(useGlobalBlockList);
      addInfoLog(`Updated global blocking flag to ${useGlobalBlockList}, reason : ${effectiveReason}`);
    }

    overlayRunningRef.current = overlayShouldBeRunning;
    prevReasonRef.current = effectiveReason;
    prevIsBlockingRef.current = shouldEnableBlocking;
    prevUseGlobalBlockListRef.current = useGlobalBlockList;
  }, [
    accessToken,
    currentFocusModeFinishTime,
    isInFocusMode,
    isPostponeActivated,
    allBlockingPermissionsGranted,
    isDaytimeBlockingEnabled,
    dispatch,
    focusDuration?.hours,
    focusDuration?.minutes,
    isRoutineActive,
    cutOffTime,
    shutdownTime,
    startupTime,
    translationI18n.resolvedLanguage,
    translationI18n.language,
    isScheduleBlocking,
    activeScheduleNamesKey,
  ]);

  useEffect(() => {
    refreshDistractionBlocking();
  }, [refreshDistractionBlocking]);

  return {
    reason,
    blockingReasonKey,
    isBlocking,
    refreshDistractionBlocking,
  };
};

export const checkIfDistractionBlockingShouldBeEnabled = ({
  accessToken,
  currentFocusModeFinishTime,
  isInFocusMode,
  isUsagePermissionGranted,
  isPostponeActivated,
  isDaytimeBlockingEnabled,
  isRoutineActive,
  cutOffTime,
  shutdownTime,
  startupTime,
}) => {
  let reason = "";

  if (!isUsagePermissionGranted) {
    reason = i18n.t("distractionBlockingReason.permissionNotGranted");
    return { shouldEnableBlocking: false, reason, reasonKey: "permissionNotGranted" };
  }

  if (isPostponeActivated) {
    reason = i18n.t("distractionBlockingReason.postponeActivated");
    return { shouldEnableBlocking: false, reason, reasonKey: "postponeActivated" };
  }

  if (!accessToken) {
    reason = i18n.t("distractionBlockingReason.notLoggedIn");
    return { shouldEnableBlocking: false, reason, reasonKey: "notLoggedIn" };
  }

  if (isInFocusMode) {
    reason = i18n.t("distractionBlockingReason.focusModeActivated");
    return { shouldEnableBlocking: true, reason, reasonKey: "focusModeActivated" };
  }

  if (currentFocusModeFinishTime) {
    const isFocusActive = new Date(currentFocusModeFinishTime).getTime() > Date.now();
    if (isFocusActive) {
      reason = i18n.t("distractionBlockingReason.focusModeActivated");
      return { shouldEnableBlocking: true, reason, reasonKey: "focusModeActivated" };
    }
  }

  if (cutOffTime && shutdownTime && startupTime) {
    const startupDateTime = getSplitDateTime(startupTime);
    const shutdownDateTime = getSplitDateTime(shutdownTime);

    const isEveningTime = calculateIsMorningOrEvening(startupDateTime, shutdownDateTime) === ROUTINE_NAMES.EVENING;

    if (isEveningTime) {
      const isBeforeCutOff = !isAfterCutOffTime(cutOffTime, startupTime);

      if (isBeforeCutOff) {
        reason = i18n.t("distractionBlockingReason.withinCutoffTimeAndShutdownTime", {
          cutoff_time: cutOffTime,
        });
        return { shouldEnableBlocking: false, reason, reasonKey: "withinCutoffTimeAndShutdownTime" };
      }
      reason = isRoutineActive
        ? i18n.t("distractionBlockingReason.afterCutoffTime")
        : i18n.t("distractionBlockingReason.afterCutoffTimeAndEveningRoutineFinished");
      return {
        shouldEnableBlocking: true,
        reason,
        reasonKey: isRoutineActive ? "afterCutoffTime" : "afterCutoffTimeAndEveningRoutineFinished",
      };
    }
  }

  if (isRoutineActive) {
    reason = i18n.t("distractionBlockingReason.otherReason");
    return { shouldEnableBlocking: true, reason, reasonKey: "otherReason" };
  }

  if (isDaytimeBlockingEnabled) {
    reason = i18n.t("distractionBlockingReason.daytimeBlockingEnabled");
    return { shouldEnableBlocking: true, reason, reasonKey: "daytimeBlockingEnabled" };
  }

  reason = i18n.t("distractionBlockingReason.defaultCase");
  return { shouldEnableBlocking: false, reason, reasonKey: "defaultCase" };
};
