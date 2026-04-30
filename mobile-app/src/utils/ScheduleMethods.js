import { ACTIVITY_PRIORITY } from "./Enums";
import { ALL } from "@/constants/activity";
import { isAfterCutOffTime } from "./TimeMethods";
import { DAYS } from "@/constants/activity";
import moment from "moment";

export const isActivityAvailableAfterCutOffTime = (activity, startupTime, cutOffTime) => {
  // If there's a customized cutoff time and it's past cutoff, return false
  if (
    activity?.cutoff_time_for_doing_activity &&
    isAfterCutOffTime(activity.cutoff_time_for_doing_activity, startupTime)
  ) {
    return false;
  }

  // If the provided cutoff time is past, only high-priority activities are allowed
  if (isAfterCutOffTime(cutOffTime, startupTime)) {
    // If the activity priority is not set, it will be considered as high priority
    return !activity?.priority || activity.priority === ACTIVITY_PRIORITY.HIGH;
  }

  return true;
};

export const isActivityAvailableToday = (activity) => {
  // Use numeric day index for locale-independent day matching
  const currentDay = DAYS[moment().day()];
  if (
    (activity && !activity.days_of_week) ||
    (activity.days_of_week && (activity.days_of_week.includes(ALL) || activity.days_of_week.includes(currentDay)))
  ) {
    return true;
  }

  return false;
};

export const isActivityAvailable = (activity, startUpTime, cutOffTime) => {
  return isActivityAvailableAfterCutOffTime(activity, startUpTime, cutOffTime) && isActivityAvailableToday(activity);
};
