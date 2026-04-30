import { useState, useEffect, useCallback } from "react";
import { useHealthMetrics } from "./useHealthMetrics";
import { useHealthPermission } from "./use-health-permission";

interface HealthData {
  sleepHours: number;
  movementMinutes: number;
  stepsCount: number;
}

export function useHealthData() {
  const [healthData, setHealthData] = useState<HealthData>({
    sleepHours: 0,
    movementMinutes: 0,
    stepsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getTotalSleepTimeToday, getMoveMinutesToday, getStepsToday } = useHealthMetrics();
  const { isHealthPermissionGranted } = useHealthPermission();

  const fetchHealthData = useCallback(async () => {
    if (!isHealthPermissionGranted) {
      setError("Health permissions not granted");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const [sleepHours, movementMinutes, stepsCount] = await Promise.all([
        getTotalSleepTimeToday(startOfDay, endOfDay),
        getMoveMinutesToday(startOfDay, endOfDay),
        getStepsToday(startOfDay, endOfDay),
      ]);

      setHealthData({
        sleepHours,
        movementMinutes,
        stepsCount,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isHealthPermissionGranted, getTotalSleepTimeToday, getMoveMinutesToday, getStepsToday]);

  useEffect(() => {
    if (isHealthPermissionGranted) {
      fetchHealthData();
    }
  }, [isHealthPermissionGranted, fetchHealthData]);

  return {
    healthData,
    isLoading,
    error,
    refetch: fetchHealthData,
  };
}
