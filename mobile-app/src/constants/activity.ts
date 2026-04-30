import { HabitPackKeys } from "@/types/HabitPacks";
import {
  DEFAULT_STARTUP_TIME,
  DEFAULT_SHUTDOWN_TIME,
  DEFAULT_CUTOFF_TIME,
  DEFAULT_BREAK_AFTER_MINUTES,
} from "./routines";

const ONE_DAY = 24 * 60 * 60 * 1000;
export const ALL = "ALL";
export const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export const MAXIMUM_ALLOWED_MINUTES = 999;

export const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;

export const ACTIVITY = {
  breathing: "breathing",
  stretching: "stretching",
  mob: "mob",
  ios: "ios",
  android: "android",
};

export const BLANK_HABITS_FOR_FOCUS_ONLY = {
  [HabitPackKeys.STARTUP_TIME]: DEFAULT_STARTUP_TIME,
  [HabitPackKeys.SHUTDOWN_TIME]: DEFAULT_SHUTDOWN_TIME,
  [HabitPackKeys.SLEEP_TIME]: DEFAULT_CUTOFF_TIME,
  break_after_minutes: DEFAULT_BREAK_AFTER_MINUTES,
  morning_activities: [],
  evening_activities: [],
  break_activities: [],
};

// Note: 3 days after January 1st 1970 is Sunday.
export const formatWeekdays = (locale: string, length: Intl.DateTimeFormatOptions["weekday"]) => {
  const formatFn = new Intl.DateTimeFormat(locale, { weekday: length, timeZone: "UTC" }).format;
  const formattedWeekdayEntries = DAYS.map((day, index) => [day, formatFn(new Date((index + 3) * ONE_DAY))]);
  return Object.fromEntries(formattedWeekdayEntries) as { [key in (typeof DAYS)[number]]: string };
};
