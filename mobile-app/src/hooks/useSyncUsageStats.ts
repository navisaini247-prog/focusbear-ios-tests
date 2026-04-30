import { useCallback, useEffect, useState, useRef } from "react";
import { Platform } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { getDeviceId } from "react-native-device-info";
import { UsageType } from "@/types/AppUsage.types";
import { getAppCategoryName } from "@/types/AppUsage.types";
import { getSplitTime } from "@/utils/TimeMethods";
import { useUsageStats } from "./use-usage-stats";
import { syncUsageStats } from "@/actions/UserActions";
import { cutOffTimeSelector } from "@/selectors/RoutineSelectors";
import { useHealthMetrics } from "./useHealthMetrics";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { useParticipantCode } from "./useParticipantCode";
import { useAppActiveState } from "./use-app-active-state";
import { useHomeContext } from "@/screens/Home/context";

const SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useSyncUsageStats = () => {
  const [lastSyncedDate, setLastSyncedDate] = useState<Date | null>(null);
  const { getUsageStats } = useUsageStats();
  const { syncHealthMetrics } = useHealthMetrics();
  const { getLastSyncedDate } = useParticipantCode();
  const { isUnicasStudyParticipant } = useHomeContext();

  const lastSyncTimeRef = useRef<number>(0);

  const cutOffTime = useSelector(cutOffTimeSelector);
  const isFocused = useIsFocused();

  const fetchTimeUsedAfterSleepWindow = useCallback(async () => {
    if (!cutOffTime) {
      return;
    }

    const now = new Date();
    const { hours: cutoffHours, min: cutoffMinutes } = getSplitTime(cutOffTime);

    const startTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffHours + 6, cutoffMinutes);
    const cutOffTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffHours, cutoffMinutes);

    const stats = await getUsageStats(cutOffTimestamp.getTime(), startTimestamp.getTime());

    return stats;
  }, [cutOffTime, getUsageStats]);

  const syncTodayUsageStats = useCallback(async () => {
    const now = Date.now();
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);
    const endOfDay = new Date(now).setHours(23, 59, 59, 999);
    const usageStats = await getUsageStats(startOfDay, endOfDay);

    const usageData = usageStats
      .filter((stat) => stat.appName !== "" && stat.totalTimeUsed / (1000 * 60) > 0)
      .map((stat) => ({
        sourceName: stat.appName,
        usageType: UsageType.APP,
        usageCategory: getAppCategoryName(stat.category),
        usageStartDate: startOfDay,
        usageEndDate: endOfDay,
        minutesUsedTotal: Math.floor(stat.totalTimeUsed / (1000 * 60)),
        minutesUsedDuringSleepWindow: 0,
        platform: Platform.OS,
        deviceId: getDeviceId(),
      }));

    const appsUsedAfterCutoff = await fetchTimeUsedAfterSleepWindow();

    usageData.forEach((app) => {
      const appUsedAfterCutoff = appsUsedAfterCutoff?.find((a) => a.appName === app.sourceName);
      if (appUsedAfterCutoff) {
        app.minutesUsedDuringSleepWindow = Math.floor(appUsedAfterCutoff.totalTimeUsed / (1000 * 60));
      }
    });

    await syncUsageStats(usageData);

    lastSyncTimeRef.current = now;
    setLastSyncedDate(new Date(now));
  }, [getUsageStats, fetchTimeUsedAfterSleepWindow]);

  const syncWithCooldown = useCallback(async () => {
    if (!isUnicasStudyParticipant) {
      return;
    }

    const now = Date.now();

    if (now - lastSyncTimeRef.current < SYNC_COOLDOWN_MS) {
      return;
    }

    if (checkIsAndroid()) {
      await syncTodayUsageStats();
    }
    await syncHealthMetrics();
    lastSyncTimeRef.current = now;
  }, [syncTodayUsageStats, syncHealthMetrics]);

  useAppActiveState(syncWithCooldown);

  useEffect(() => {
    if (isFocused) {
      syncWithCooldown();
    }
  }, [isFocused]);

  useEffect(() => {
    const fetchLastSyncedDate = async () => {
      const { healthDataLastReceived } = await getLastSyncedDate();
      setLastSyncedDate(healthDataLastReceived);
    };
    fetchLastSyncedDate();
  }, []);

  return {
    lastSyncedDate,
    syncWithCooldown,
    setLastSyncedDate,
  };
};
