import { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fullRoutineDataSelector,
  cutOffTimeSelector,
  startUpTimeSelector,
  shutDownTimeSelector,
} from "@/selectors/RoutineSelectors";
import { currentSkippedActivitiesSelector, todayRoutineProgressSelector } from "@/selectors/UserSelectors";
import { useIsActivityLocked } from "./use-is-freemium";
import { useIsMorningOrEvening } from "./use-current-routine-name";
import { isActivityAvailable, isActivityAvailableToday } from "@/utils/ScheduleMethods";
import { getSplitDateTime, isBetweenDates } from "@/utils/TimeMethods";
import { capitalize } from "lodash";
import {
  ACTIVITY_TYPE,
  ROUTINE_NAMES,
  ROUTINE_PROGRESS_KEY,
  ROUTINE_STATUS,
  ROUTINE_TRIGGER,
} from "@/constants/routines";
import type { Activity, ActivityType, CustomRoutine, RoutineProgress, RoutineStatus } from "@/types/Routine";
import { calculateIsRoutineCompleted } from "@/utils/ActivityRoutineMethods";

export interface FormattedActivity extends Activity {
  isCompleted: boolean;
  isSkipped: boolean;
  isLocked: boolean;
  isAvailable: boolean;
  isRoutineAvailable: boolean;
  aiGenerated?: boolean;
}

export interface FormattedRoutine extends Omit<CustomRoutine, "standalone_activities"> {
  activities: FormattedActivity[];
  /** For simplicity, custom routines have type="standalone", same as their activities */
  type: ActivityType;
  isCompleted: boolean;
  /** Includes routines that are available today and either on-demand or scheduled now */
  isAvailable: boolean;
  /** Includes only *scheduled* routines that are available today and scheduled now */
  isScheduledNow: boolean;
}

/**
 * Compiles all routines (morning + evening + custom) into a uniform array with extra properties.
 * Intended to reduce the complexity of UI rendering logic for UIs that display the list of routines or activities.
 */
export const useRoutineData = () => {
  const { t } = useTranslation();
  const cutOffTime = useSelector(cutOffTimeSelector);
  const startUpTime = useSelector(startUpTimeSelector);
  const shutDownTime = useSelector(shutDownTimeSelector);
  const fullRoutineData = useSelector(fullRoutineDataSelector);
  const todayRoutineProgress = useSelector(todayRoutineProgressSelector);
  const skippedActivities = useSelector(currentSkippedActivitiesSelector);
  const isActivityLocked = useIsActivityLocked();
  const isMorningTimeNow = useIsMorningOrEvening() === ROUTINE_NAMES.MORNING;

  // Add isCompleted, isSkipped etc properties to activities
  const formatActivities = useCallback(
    (activities: Activity[], completedActivities: string[], status: RoutineStatus, isRoutineAvailable: boolean) =>
      (activities || []).map((activity, index) => ({
        ...activity,
        isCompleted: status === ROUTINE_STATUS.COMPLETED || completedActivities.includes(activity.id),
        isSkipped: (skippedActivities || []).includes(activity.id),
        isLocked: isActivityLocked(index),
        isAvailable: isActivityAvailable(activity, startUpTime, cutOffTime),
        isRoutineAvailable,
      })),
    [cutOffTime, isActivityLocked, skippedActivities, startUpTime],
  );

  // Create a routine object from a list of activities for morning and evening routines
  const formatMorningEveningRoutine = useCallback(
    (activities: Activity[], type: ActivityType): FormattedRoutine => {
      const routineProgress = todayRoutineProgress?.[ROUTINE_PROGRESS_KEY[type]];
      const completedActivities = routineProgress?.completed_habit_ids || [];
      const status = routineProgress?.status;

      const isCompleted =
        routineProgress?.status === ROUTINE_STATUS.COMPLETED ||
        calculateIsRoutineCompleted({
          activities,
          completedActivities,
          skippedActivities,
          startUpTime,
          cutOffTime,
        });

      const isMorning = type === ACTIVITY_TYPE.MORNING;

      const isScheduledNow = isMorning === isMorningTimeNow;
      const isAvailable = isScheduledNow;

      const formattedActivities = formatActivities(activities, completedActivities, status, isAvailable);

      return {
        id: type,
        name: capitalize(isMorning ? t("common.morning") : t("common.evening")),
        trigger: ROUTINE_TRIGGER.ON_SCHEDULE,
        start_time: isMorning ? startUpTime : shutDownTime,
        end_time: isMorning ? shutDownTime : startUpTime,
        // Note: there's no way to get the activity_sequence_id of the morning/evening routine if they're empty
        activity_sequence_id: activities[0]?.activity_sequence_id || null,
        activities: formattedActivities,
        type,
        isCompleted,
        isAvailable,
        isScheduledNow,
      };
    },
    [
      todayRoutineProgress,
      skippedActivities,
      startUpTime,
      shutDownTime,
      cutOffTime,
      formatActivities,
      isMorningTimeNow,
      t,
    ],
  );

  const formatCustomRoutines = useCallback(
    (routines: CustomRoutine[]): FormattedRoutine[] =>
      routines.map((routine) => {
        const customRoutinesProgress = todayRoutineProgress?.custom_routines || [];
        const routineProgress = customRoutinesProgress.find(
          (item: RoutineProgress) => item?.sequence_id === routine?.activity_sequence_id,
        );
        const completedActivities = routineProgress?.completed_habit_ids || [];
        const status = routineProgress?.status;

        const { standalone_activities: activities = [], ...rest } = routine;

        const isCompleted =
          routineProgress?.status === ROUTINE_STATUS.COMPLETED ||
          calculateIsRoutineCompleted({
            activities,
            completedActivities,
            skippedActivities,
            startUpTime,
            cutOffTime,
          });

        // Custom routines have a days_of_week just like activities
        const isAvailableToday = isActivityAvailableToday(routine);

        const isScheduledNow =
          isAvailableToday &&
          routine?.trigger === ROUTINE_TRIGGER.ON_SCHEDULE &&
          isBetweenDates(getSplitDateTime(routine?.start_time), getSplitDateTime(routine?.end_time));

        const isScheduledNowOrOnDemand = isScheduledNow || routine?.trigger === ROUTINE_TRIGGER.ON_DEMAND;
        const isAvailable = isScheduledNowOrOnDemand && isAvailableToday;

        const formattedActivities = formatActivities(activities, completedActivities, status, isAvailable);

        return {
          ...rest,
          activities: formattedActivities,
          // Note: custom routines have type="standalone"
          type: ACTIVITY_TYPE.STANDALONE,
          isCompleted,
          isAvailable,
          isScheduledNow,
        };
      }),
    [todayRoutineProgress, skippedActivities, startUpTime, cutOffTime, formatActivities],
  );

  return useMemo(
    () => [
      formatMorningEveningRoutine(fullRoutineData?.morning_activities || [], ACTIVITY_TYPE.MORNING),
      formatMorningEveningRoutine(fullRoutineData?.evening_activities || [], ACTIVITY_TYPE.EVENING),
      ...formatCustomRoutines(fullRoutineData?.custom_routines || []),
    ],
    [formatMorningEveningRoutine, formatCustomRoutines, fullRoutineData],
  );
};
