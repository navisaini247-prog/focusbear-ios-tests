import { isBetweenDates, getSplitDateTime, getMorningEveningDateTime } from "./TimeMethods";
import { isActivityAvailable } from "./ScheduleMethods";
import { ROUTINE_NAMES } from "@/constants";
import { ROUTINE_STATUS, ROUTINE_TRIGGER } from "@/constants/routines";
import type { Activity, CustomRoutine, RoutineData, RoutineProgress, TodayRoutineProgress } from "@/types/Routine";

export const calculateIsMorningOrEvening = (startUpDateTime: Date, shutDownDateTime: Date): string => {
  const isMorningRoutineTime = isBetweenDates(startUpDateTime, shutDownDateTime);

  return isMorningRoutineTime ? ROUTINE_NAMES.MORNING : ROUTINE_NAMES.EVENING;
};

export const getIsMorningOrEvening = () => {
  const { startUpDateTime, shutDownDateTime } = getMorningEveningDateTime();
  return calculateIsMorningOrEvening(startUpDateTime, shutDownDateTime);
};

export const getActivitiesByActivitySequenceId = (
  activitySequenceId: string,
  fullRoutineData: RoutineData,
): Activity[] | undefined => {
  const allActivitiesArrays = [
    fullRoutineData.morning_activities,
    fullRoutineData.evening_activities,
    ...(fullRoutineData.custom_routines || []).map((routine) => routine.standalone_activities),
  ];
  return allActivitiesArrays.find((activities) => activities?.[0]?.activity_sequence_id === activitySequenceId);
};

export const getRoutineProgressByActivitySequenceId = (
  activitySequenceId: string,
  todayRoutineProgress: TodayRoutineProgress,
): RoutineProgress | undefined => {
  const allRoutineProgressObjects = [
    todayRoutineProgress.morning_routine,
    todayRoutineProgress.evening_routine,
    ...(todayRoutineProgress.custom_routines || []),
  ];
  return allRoutineProgressObjects.find((routineProgress) => routineProgress?.sequence_id === activitySequenceId);
};

/**
 * Checks over every activity in a routine to determine if the routine is completed
 */
export const calculateIsRoutineCompleted = ({
  activities,
  completedActivities,
  skippedActivities,
  startUpTime,
  cutOffTime,
}: {
  activities: Activity[];
  completedActivities?: string[];
  skippedActivities?: string[];
  startUpTime: string;
  cutOffTime: string;
}): boolean => {
  if (activities.length === 0) return false;
  const completed = completedActivities || [];
  const skipped = skippedActivities || [];

  // Return true if every activity is either COMPLETED, or SKIPPED, or if at least one activity is COMPLETED or SKIPPED
  // and the rest is NOT AVAILABLE
  return (
    activities.every((activity: Activity) => completed.includes(activity?.id) || skipped.includes(activity?.id)) ||
    (activities.some((activity: Activity) => completed.includes(activity?.id) || skipped.includes(activity?.id)) &&
      activities.every(
        (activity: Activity) =>
          completed.includes(activity?.id) ||
          skipped.includes(activity?.id) ||
          !isActivityAvailable(activity, startUpTime, cutOffTime),
      ))
  );
};

export const calculateIsAnyRoutineActive = (
  fullRoutineData: RoutineData,
  todayRoutineProgress: TodayRoutineProgress,
  skippedActivities: string[],
): boolean => {
  if (!fullRoutineData?.startup_time || !fullRoutineData?.shutdown_time) {
    return false;
  }

  const startUpTime = fullRoutineData.startup_time;
  const shutDownTime = fullRoutineData.shutdown_time;
  const cutOffTime = fullRoutineData.cutoff_time_for_high_priority_activities;
  const customRoutinesProgress = todayRoutineProgress?.custom_routines || [];
  const isMorningTime = isBetweenDates(getSplitDateTime(startUpTime), getSplitDateTime(shutDownTime));

  return [
    {
      activities: fullRoutineData.morning_activities || [],
      routineProgress: todayRoutineProgress?.morning_routine,
      isScheduledNow: isMorningTime,
    },
    {
      activities: fullRoutineData.evening_activities || [],
      routineProgress: todayRoutineProgress?.evening_routine,
      isScheduledNow: !isMorningTime,
    },
    ...(fullRoutineData.custom_routines || []).map((routine: CustomRoutine) => ({
      activities: routine.standalone_activities || [],
      routineProgress: customRoutinesProgress.find(
        (item: RoutineProgress) => item?.sequence_id === routine?.activity_sequence_id,
      ),
      isScheduledNow:
        routine?.trigger === ROUTINE_TRIGGER.ON_SCHEDULE &&
        isBetweenDates(getSplitDateTime(routine?.start_time), getSplitDateTime(routine?.end_time)),
    })),
  ].some(({ activities, routineProgress, isScheduledNow }) => {
    if (routineProgress?.status === ROUTINE_STATUS.IN_PROGRESS) {
      return true;
    }

    if (
      activities.length === 0 ||
      routineProgress?.status === ROUTINE_STATUS.COMPLETED ||
      routineProgress?.status === ROUTINE_STATUS.POSTPONED
    ) {
      return false;
    }

    const isCompleted = calculateIsRoutineCompleted({
      activities,
      completedActivities: routineProgress?.completed_habit_ids,
      skippedActivities,
      startUpTime,
      cutOffTime,
    });

    return isScheduledNow && !isCompleted;
  });
};
