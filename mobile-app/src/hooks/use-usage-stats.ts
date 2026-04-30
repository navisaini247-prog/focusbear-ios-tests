import { useState } from "react";
import { useDispatch } from "react-redux";
import { appsUsageSelector } from "@/reducers/UserReducer";
import { useSelector } from "react-redux";
import { setAppsUsage } from "@/actions/UserActions";
import { getAppUsageStats } from "@/utils/NativeModuleMethods";
import { UsageStats } from "@/types/AppUsage.types";
interface UseUsageStatsReturn {
  appsStats: UsageStats[];
  isLoading: boolean;
  error: string | null;
  fetchStats: (startTime: number, endTime: number) => Promise<void>;
  getUsageStats: (startTime: number, endTime: number) => Promise<UsageStats[]>;
}

export const useUsageStats = (): UseUsageStatsReturn => {
  const dispatch = useDispatch();
  const appsUsage = useSelector(appsUsageSelector);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getUsageStats = async (startTime: number, endTime: number) => {
    const result = await getAppUsageStats(startTime, endTime);
    return result;
  };

  const fetchStats = async (startTime: number, endTime: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getUsageStats(startTime, endTime);

      // Merge new usage stats with existing block counts
      const mergedStats = result.reduce((acc, newStat) => {
        const existingApp = appsUsage?.[newStat.packageName];
        acc[newStat.packageName] = {
          ...newStat,
          blockCount: existingApp?.blockCount || 0,
          lastBlockedAt: existingApp?.lastBlockedAt,
        };
        return acc;
      }, {});

      dispatch(setAppsUsage(mergedStats));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch usage stats");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    appsStats: Object.values(appsUsage || {}),
    isLoading,
    error,
    fetchStats,
    getUsageStats,
  };
};
