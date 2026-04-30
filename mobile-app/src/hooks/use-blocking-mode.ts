import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, DeviceEventEmitter } from "react-native";
import type { BlockingScheduleSummary } from "@/nativeModule/NativeBlockingScheduleModule";
import { BLOCKING_MODE } from "@/constants/blockingSchedule";
import { getBlockingSchedulesNativeMethod, updateScheduleBlockingStatus } from "@/utils/NativeModuleMethods";

type BlockingMode = (typeof BLOCKING_MODE)[keyof typeof BLOCKING_MODE];

export function useBlockingMode() {
  const [mode, setMode] = useState<BlockingMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeSchedules, setActiveSchedules] = useState<BlockingScheduleSummary[]>([]);
  const [isInSoftUnlockPeriod, setIsInSoftUnlockPeriod] = useState(false);


  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get active schedule IDs from native method
      const status = await updateScheduleBlockingStatus();

      const unlockEndTime = status?.temporaryUnlockEndTime ?? null;
      const nowSeconds = Date.now() / 1000;
      const isActive = unlockEndTime !== null && unlockEndTime > nowSeconds;
      setIsInSoftUnlockPeriod(isActive);


      const activeScheduleIds = Array.isArray(status?.activeScheduleIds) ? status.activeScheduleIds : [];

      if (activeScheduleIds.length === 0) {
        setActiveSchedules([]);
        setMode(null);
        return;
      }

      // Fetch all schedules and filter to only active ones
      const allSchedules = (await getBlockingSchedulesNativeMethod()) as BlockingScheduleSummary[];

      const active = allSchedules.filter((s) => activeScheduleIds.includes(s.id) && s.type !== "habit");
      setActiveSchedules(active);

      if (active.length === 0) {
        setMode(null);
        return;
      }
      // If any active schedule is strict or super_strict, overall mode is strict
      const isStrict = active.some((s) => {
        const scheduleMode = s.blockingMode;
        return scheduleMode === BLOCKING_MODE.STRICT || scheduleMode === BLOCKING_MODE.SUPER_STRICT;
      });
      setMode(isStrict ? BLOCKING_MODE.STRICT : BLOCKING_MODE.GENTLE);
    } catch (e: any) {
      setError(e);
      setActiveSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const subscription = DeviceEventEmitter.addListener("onBlockingStatusChanged", () => {
      refresh();
    });

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refresh();
      }
    });

    return () => {
      subscription.remove();
      appStateSubscription.remove();
    };
  }, [refresh]);

  return useMemo(
    () => ({ mode, loading, error, refresh, activeSchedules, isInSoftUnlockPeriod }),
    [mode, loading, error, refresh, activeSchedules, isInSoftUnlockPeriod],
  );
}

export default useBlockingMode;
