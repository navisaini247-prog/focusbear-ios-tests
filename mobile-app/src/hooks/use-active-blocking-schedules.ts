import { useCallback, useEffect, useMemo, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { addInfoLog } from "@/utils/FileLogger";
import { getBlockingSchedulesNativeMethod, updateScheduleBlockingStatus } from "@/utils/NativeModuleMethods";
import type { BlockingScheduleSummary } from "@/nativeModule/NativeBlockingScheduleModule";

export type ScheduleBlockingSummary = {
  isScheduleBlocking: boolean;
  activeScheduleIds: string[];
  activeScheduleNames: string[];
  activeScheduleCount: number;
  hasGlobalSelection: boolean;
  isPaused: boolean;
  pauseState: string;
  pauseUntil: number | null;
  totalApplications: number;
};

const defaultSummary: ScheduleBlockingSummary = {
  isScheduleBlocking: false,
  activeScheduleIds: [],
  activeScheduleNames: [],
  activeScheduleCount: 0,
  hasGlobalSelection: false,
  isPaused: false,
  pauseState: "none",
  pauseUntil: null,
  totalApplications: 0,
};

const normalizeSummary = (input: any): ScheduleBlockingSummary => {
  if (!input || typeof input !== "object") {
    return defaultSummary;
  }

  const activeScheduleIds = Array.isArray(input.activeScheduleIds) ? input.activeScheduleIds : [];
  const activeScheduleNames = Array.isArray(input.activeScheduleNames) ? input.activeScheduleNames : [];
  const activeScheduleCount =
    typeof input.activeScheduleCount === "number" ? input.activeScheduleCount : activeScheduleIds.length;

  return {
    isScheduleBlocking: Boolean(input.isScheduleBlocking),
    activeScheduleIds,
    activeScheduleNames,
    activeScheduleCount,
    hasGlobalSelection: Boolean(input.hasGlobalSelection),
    isPaused: Boolean(input.isPaused),
    pauseState: typeof input.pauseState === "string" ? input.pauseState : "none",
    pauseUntil: typeof input.pauseUntil === "number" ? input.pauseUntil : null,
    totalApplications: typeof input.totalApplications === "number" ? input.totalApplications : 0,
  };
};

export const useActiveBlockingSchedules = () => {
  const [summary, setSummary] = useState<ScheduleBlockingSummary>(defaultSummary);
  const [activeSchedules, setActiveSchedules] = useState<BlockingScheduleSummary[]>([]);

  const updateActiveSchedules = useCallback(async (activeIds: string[]) => {
    if (!activeIds.length) {
      setActiveSchedules([]);
      return;
    }

    try {
      const allSchedules = (await getBlockingSchedulesNativeMethod()) as BlockingScheduleSummary[];
      const active = allSchedules.filter((schedule) => activeIds.includes(schedule.id));
      setActiveSchedules(active);
    } catch (scheduleError: any) {
      addInfoLog(
        `[ScheduleBlocking] Failed to fetch full schedules: ${
          scheduleError?.message ?? scheduleError?.toString?.() ?? "unknown error"
        }`,
      );
      setActiveSchedules([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const result = await updateScheduleBlockingStatus();
      if (result) {
        const normalized = normalizeSummary(result);
        setSummary(normalized);
        updateActiveSchedules(normalized.activeScheduleIds);
        return normalized;
      }
    } catch (error: any) {
      addInfoLog(
        `[ScheduleBlocking] Failed to refresh status: ${error?.message ?? error?.toString?.() ?? "unknown error"}`,
      );
    }

    setSummary(defaultSummary);
    setActiveSchedules([]);
    return defaultSummary;
  }, [updateActiveSchedules]);

  useEffect(() => {
    refresh();

    const subscription = DeviceEventEmitter.addListener("onBlockingStatusChanged", (payload) => {
      if (!payload) {
        refresh();
        return;
      }

      const normalized = normalizeSummary(payload);
      setSummary(normalized);
      updateActiveSchedules(normalized.activeScheduleIds);
    });

    return () => {
      subscription.remove();
    };
  }, [refresh, updateActiveSchedules]);

  const hasHabitScheduleActive = useMemo(() => {
    const habitScheduleIds = ["habit_morning", "habit_sleep"];
    return summary.activeScheduleIds.some((id) => habitScheduleIds.includes(id));
  }, [summary.activeScheduleIds]);

  return {
    isScheduleBlocking: summary.isScheduleBlocking,
    activeScheduleNames: summary.activeScheduleNames,
    activeScheduleIds: summary.activeScheduleIds,
    activeSchedules,
    hasHabitScheduleActive,
  } as const;
};
