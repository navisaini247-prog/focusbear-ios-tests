import { userRoutineDataAction } from "@/actions/RoutineActions";
import {
  getScheduleBlockingStatusNativeMethod,
  refreshWidgetData,
  startOverlayServiceNativeMethod,
  stopOverlayServiceNativeMethod,
  updateScheduleBlockingStatus,
} from "@/utils/NativeModuleMethods";
import BackgroundFetch from "react-native-background-fetch";
import {
  checkIfDistractionBlockingShouldBeEnabled,
  shouldUseGlobalBlockListForReasonKey,
} from "./use-enable-distraction-blocking";
import { useDispatch } from "react-redux";
import { clearPreviousFocusSession, getCurrentActivityProps } from "@/actions/UserActions";
import { useCallback, useEffect } from "react";
import { addErrorLog, addInfoLog } from "@/utils/FileLogger";
import NetInfo from "@react-native-community/netinfo";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { store } from "@/store";
import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import { setBlockingReason, setScheduleBlockingStatus } from "@/actions/GlobalActions";
import { ControlFunction } from "@/utils/NativeModuleMethods";
import LateNoMoreManager from "@/controllers/LateNoMoreManager";
import { calculateIsAnyRoutineActive } from "@/utils/ActivityRoutineMethods";

export const useHandleBackgroundFetch = () => {
  const dispatch = useDispatch();

  const enableBlockingIfNeeded = useCallback(async () => {
    const state = store.getState(); // get the entire state
    const user = state.user;
    const accessToken = user.accessToken;
    const currentFocusModeFinishTime = user?.current_focus_mode_finish_time;
    const isDaytimeBlockingEnabled = user?.userLocalDeviceSettingsData?.MacOS?.kIsDaytimeBlockingEnabled;
    const isInFocusMode = state.focusMode.isInFocusMode;
    const isPostponeActivated = state.global.isPostoneActivated;
    const isOverlayPermissionGranted = state.global.isOverlayPermissionGranted;
    const isScreenTimePermissionGranted = state.global.isScreenTimePermissionGranted;
    const todayRoutineProgress = user.today_routine_progress;
    const skippedActivities = user.current_sequence_skipped_activities;
    const fullRoutineData = state.routine.fullRoutineData;
    const cutOffTime =
      state.routine.fullRoutineData?.cutoff_time_for_non_high_priority_activities ||
      state.routine.fullRoutineData?.sleep_time;
    const shutdownTime = state.routine.fullRoutineData?.shutdown_time;
    const startupTime = state.routine.fullRoutineData?.startup_time;

    const isRoutineActive = calculateIsAnyRoutineActive(fullRoutineData, todayRoutineProgress, skippedActivities);

    let scheduleBlockingStatus = null;
    if (checkIsIOS()) {
      try {
        scheduleBlockingStatus = await getScheduleBlockingStatusNativeMethod();
        dispatch(setScheduleBlockingStatus(scheduleBlockingStatus));
      } catch (e) {
        addInfoLog(`Failed to check schedule blocking status: ${e?.message ?? e}`);
      }
    }

    const { shouldEnableBlocking, reason, reasonKey } = checkIfDistractionBlockingShouldBeEnabled({
      accessToken,
      currentFocusModeFinishTime,
      isInFocusMode,
      isUsagePermissionGranted: checkIsAndroid() ? isOverlayPermissionGranted : isScreenTimePermissionGranted,
      isPostponeActivated,
      isDaytimeBlockingEnabled,
      isRoutineActive,
      cutOffTime,
      shutdownTime,
      startupTime,
      scheduleBlockingStatus,
    });

    postHogCapture(POSTHOG_EVENT_NAMES.PERIODIC_BACKGROUND_BLOCKING, {
      enabled: shouldEnableBlocking,
      reason,
    });

    if (!shouldEnableBlocking) {
      addInfoLog(`Distraction blocking disabled, reason : ${reason}`);
      dispatch(clearPreviousFocusSession());
      stopOverlayServiceNativeMethod();
      if (checkIsIOS()) {
        await updateScheduleBlockingStatus();
        dispatch(setBlockingReason(reason));
        ControlFunction.setBlockingReason(reason);
        refreshWidgetData();
      }
      return;
    }

    addInfoLog(`Distraction blocking enabled, reason : ${reason}`);
    const useGlobalBlockList = shouldUseGlobalBlockListForReasonKey(reasonKey);
    startOverlayServiceNativeMethod({ useGlobalBlockList });

    if (checkIsIOS()) {
      await updateScheduleBlockingStatus();
    }

    dispatch(setBlockingReason(reason));
    if (checkIsIOS()) {
      ControlFunction.setBlockingReason(reason);
      refreshWidgetData();
    }
  }, [dispatch]);

  const initBackgroundFetch = useCallback(async () => {
    await BackgroundFetch.configure(
      {
        taskId: "com.focusbear.fetch",
        forceAlarmManager: true,
        periodic: true,
        minimumFetchInterval: 15,
        enableHeadless: true,
        stopOnTerminate: false,
        startOnBoot: true,
      },
      async (taskId) => {
        postHogCapture(POSTHOG_EVENT_NAMES.PERIODIC_BACKGROUND_BLOCKING);

        // Guard against clearly-offline state to avoid unnecessary error events (#4162)
        let isConnected = false;
        if (NetInfo && typeof NetInfo.fetch === "function") {
          const netState = await NetInfo.fetch();
          isConnected = netState.isConnected;
        }
        if (isConnected) {
          dispatch(userRoutineDataAction());
          dispatch(getCurrentActivityProps());
        } else {
          addInfoLog("use-handle-background-fetch: skipping network calls — no connection or NetInfo unavailable");
        }

        // enableBlockingIfNeeded reads local Redux state only — always runs regardless of network
        await enableBlockingIfNeeded();

        try {
          await LateNoMoreManager.checkUpcomingMeetings();
        } catch (error) {
          addErrorLog(`[Background Fetch] Error checking meetings: ${error.message}`);
        }

        BackgroundFetch.finish(taskId);
      },
      async (taskId) => {
        // <-- Task timeout callback
        // This task has exceeded its allowed running-time.
        // You must stop what you're doing and immediately .finish(taskId)
        BackgroundFetch.finish(taskId);
      },
    );
  }, [dispatch, enableBlockingIfNeeded]);

  useEffect(() => {
    initBackgroundFetch();
  }, [initBackgroundFetch]);
};
