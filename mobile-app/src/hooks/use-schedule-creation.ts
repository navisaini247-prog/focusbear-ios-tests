import { useCallback, useEffect } from "react";
import { useSelector } from "@/reducers";
import { useDispatch } from "react-redux";

import { addInfoLog } from "@/utils/FileLogger";
import { cutOffTimeSelector, startUpTimeSelector, shutDownTimeSelector } from "@/selectors/RoutineSelectors";
import { i18n } from "@/localization";
import { isFocusOnlyGoalSelectedSelector } from "@/selectors/GlobalSelectors";
import { syncHabitBlockingWindowsNativeMethod, updateScheduleBlockingStatus } from "@/utils/NativeModuleMethods";
import { BLOCKING_MODE } from "@/constants/blockingSchedule";

const parseTimeToParts = (value: string | null | undefined): { hour: number; minute: number } | null => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const parts = value.split(":");
  if (parts.length !== 2) {
    return null;
  }
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  return { hour, minute };
};

const MIN_WINDOW_GAP_MINUTES = 10;

const areTimesTooClose = (
  start: { hour: number; minute: number } | null,
  end: { hour: number; minute: number } | null,
) => {
  if (!start || !end) {
    return true;
  }
  const startTotal = start.hour * 60 + start.minute;
  const endTotal = end.hour * 60 + end.minute;
  return Math.abs(startTotal - endTotal) < MIN_WINDOW_GAP_MINUTES;
};

export const useScheduleCreation = () => {
  const dispatch = useDispatch();
  const startupTime = useSelector(startUpTimeSelector);
  const shutdownTime = useSelector(shutDownTimeSelector);
  const cutOffTime = useSelector(cutOffTimeSelector) as string | null;
  const { userLocalDeviceSettingsData } = useSelector((state: any) => state.user);
  const isEasySkipEnabled = userLocalDeviceSettingsData?.MacOS?.kIsEasySkipEnabled ?? false;
  const isFocusOnlyGoalSelected = useSelector(isFocusOnlyGoalSelectedSelector);

  const syncSchedules = useCallback(async () => {
    if (isFocusOnlyGoalSelected) {
      addInfoLog("[ScheduleCreation] Skipping schedule sync because focus-only goal is selected");
      return;
    }

    const morningStart = parseTimeToParts(startupTime);
    const morningEnd = parseTimeToParts(shutdownTime);
    const sleepStart = parseTimeToParts(cutOffTime);

    const windows = [];

    // Add habit schedules (morning and sleep)
    if (morningStart && morningEnd && !areTimesTooClose(morningStart, morningEnd)) {
      const blockingMode = isEasySkipEnabled ? BLOCKING_MODE.GENTLE : BLOCKING_MODE.STRICT;
      windows.push({
        id: "habit_morning",
        name: i18n.t("blockingSchedule.habitMorningName"),
        startHour: morningStart.hour,
        startMinute: morningStart.minute,
        endHour: morningEnd.hour,
        endMinute: morningEnd.minute,
        daysOfWeek: [],
        blockingMode,
        type: "habit",
      });
    } else if (morningStart && morningEnd) {
      addInfoLog("[ScheduleCreation] Skipped morning habit schedule because times are too close");
    }

    if (sleepStart && morningStart && !areTimesTooClose(sleepStart, morningStart)) {
      const blockingMode = isEasySkipEnabled ? BLOCKING_MODE.GENTLE : BLOCKING_MODE.STRICT;
      windows.push({
        id: "habit_sleep",
        name: i18n.t("healthMetrics.sleep"),
        startHour: sleepStart.hour,
        startMinute: sleepStart.minute,
        endHour: morningStart.hour,
        endMinute: morningStart.minute,
        daysOfWeek: [],
        blockingMode,
        type: "habit",
      });
    } else if (sleepStart && morningStart) {
      addInfoLog("[ScheduleCreation] Skipped sleep habit schedule because times are too close");
    }

    if (windows.length > 0) {
      try {
        await syncHabitBlockingWindowsNativeMethod(windows);
        await updateScheduleBlockingStatus();
      } catch (error: any) {
        addInfoLog(
          `[ScheduleCreation] Failed to sync schedules: ${error?.message ?? error?.toString?.() ?? "unknown error"}`,
        );
      }
    }
  }, [startupTime, shutdownTime, cutOffTime, isEasySkipEnabled, isFocusOnlyGoalSelected, dispatch]);

  useEffect(() => {
    syncSchedules();
  }, []);

  return {
    syncSchedules,
  };
};

export default useScheduleCreation;
