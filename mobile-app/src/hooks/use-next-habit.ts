import { useMemo } from "react";
import type { FormattedActivity, FormattedRoutine } from "@/hooks/use-routine-data";

type RoutineProcessEntry = { duration?: number | string };

export interface RoutineWithVisibleActivities extends FormattedRoutine {
  visibleActivities: FormattedActivity[];
  completedCount: number;
  unavailableCount: number;
}

export function useNextHabit(
  routineData: FormattedRoutine[],
  routineProcess: Record<string, RoutineProcessEntry> | undefined,
): {
  routineVisibleActivities: RoutineWithVisibleActivities[];
  nextActivity: FormattedActivity | null;
} {
  const routineVisibleActivities = useMemo(
    () =>
      routineData.map((routine) => {
        const { activities } = routine;
        return {
          ...routine,
          visibleActivities: activities.filter((activity) => !activity.isCompleted && activity.isAvailable),
          completedCount: activities.reduce((acc, item) => (item.isCompleted ? acc + 1 : acc), 0),
          unavailableCount: activities.reduce(
            (acc, item) => (!item.isCompleted && !item.isAvailable ? acc + 1 : acc),
            0,
          ),
        };
      }),
    [routineData],
  );

  const nextActivity = useMemo(() => {
    const currentRoutine = routineVisibleActivities.find((routine) => routine.isAvailable && !routine.isCompleted);
    if (!currentRoutine) return null;

    const { visibleActivities } = currentRoutine;
    const processKeys = Object.keys(routineProcess ?? {});
    const activityInProgress = visibleActivities.find((activity) => processKeys.includes(activity.id));

    return activityInProgress ?? visibleActivities[0] ?? null;
  }, [routineVisibleActivities, routineProcess]);

  return { routineVisibleActivities, nextActivity };
}
