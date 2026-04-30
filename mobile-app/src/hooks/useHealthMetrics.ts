import { useCallback, useState } from "react";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import GoogleFit from "react-native-google-fit";
import { HealthMetricType, HealthMetricItem } from "@/types/HealthMetrics.types";
import { addInfoLog, addErrorLog } from "@/utils/FileLogger";
import { syncHealthData } from "@/actions/UserActions";
import { useHomeContext } from "@/screens/Home/context";

interface GoogleFitMoveMinutesData {
  duration: number;
  startDate: string;
  endDate: string;
}

const calculateDifferenceInSeconds = (startDate: string, endDate: string) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return end - start;
};

export function useHealthMetrics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isUnicasStudyParticipant } = useHomeContext() as { isUnicasStudyParticipant?: boolean };

  const getTotalSleepTimeToday = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      if (checkIsAndroid()) {
        if (!GoogleFit.isAuthorized) {
          return 0;
        }

        const sleepData = await GoogleFit.getSleepSamples(
          {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          true,
        );
        const totalSleepSeconds = sleepData.reduce(
          (acc, curr) => acc + calculateDifferenceInSeconds(curr.startDate, curr.endDate),
          0,
        );
        const totalSleepHours = totalSleepSeconds / (1000 * 60 * 60);
        return totalSleepHours || 0;
      } else {
        // HealthKit removed - return 0 for iOS
        return 0;
      }
    } catch (err) {
      return 0;
    }
  }, []);

  const getMoveMinutesToday = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      if (checkIsAndroid()) {
        if (!GoogleFit.isAuthorized) {
          return 0;
        }

        const moveMinutesData = (await GoogleFit.getMoveMinutes({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })) as unknown as GoogleFitMoveMinutesData[];
        const totalStandingMinutes = moveMinutesData.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        return totalStandingMinutes || 0;
      } else {
        // HealthKit removed - return 0 for iOS
        return 0;
      }
    } catch (err) {
      console.error("Error fetching health data:", err);
      return 0;
    }
  }, []);

  const getStepsToday = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      if (checkIsAndroid()) {
        if (!GoogleFit.isAuthorized) {
          return 0;
        }

        const stepsData = await GoogleFit.getDailyStepCountSamples({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        let totalSteps = 0;

        for (const steps of stepsData) {
          for (const step of steps.steps) {
            totalSteps += step.value;
          }
        }

        return totalSteps;
      } else {
        // HealthKit removed - return 0 for iOS
        return 0;
      }
    } catch (err) {
      console.error("Error fetching health data:", err);
      return 0;
    }
  }, []);

  const syncHealthMetrics = useCallback(async () => {
    if (!isUnicasStudyParticipant) {
      return;
    }

    setLoading(true);
    setError(null);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    try {
      const sleepHours = await getTotalSleepTimeToday(startOfDay, endOfDay);
      const minutesOfMovement = await getMoveMinutesToday(startOfDay, endOfDay);
      const stepsCount = await getStepsToday(startOfDay, endOfDay);

      const healthMetrics: HealthMetricItem[] = [
        {
          metricType: HealthMetricType.HOURS_OF_SLEEP,
          dayOfTracking: startOfDay,
          metricValue: sleepHours,
        },
        {
          metricType: HealthMetricType.MINUTES_OF_MOVEMENT,
          dayOfTracking: startOfDay,
          metricValue: minutesOfMovement,
        },
        {
          metricType: HealthMetricType.NUMBER_OF_STEPS_MOVED,
          dayOfTracking: startOfDay,
          metricValue: stepsCount,
        },
      ];
      await syncHealthData(healthMetrics);
      addInfoLog("Health metrics synced successfully");
    } catch (err) {
      setError(String(err));
      addErrorLog(`Error syncing health metrics: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [isUnicasStudyParticipant, getTotalSleepTimeToday, getMoveMinutesToday, getStepsToday]);

  return {
    syncHealthMetrics,
    loading,
    error,
    getTotalSleepTimeToday,
    getMoveMinutesToday,
    getStepsToday,
  };
}
