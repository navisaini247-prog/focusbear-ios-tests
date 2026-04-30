// Internal type
export const ROUTINE_NAMES = {
  MORNING: "MORNING",
  EVENING: "EVENING",
} as const;

// Used as values of `activity_type` property of activity objects
export const ACTIVITY_TYPE = {
  MORNING: "morning",
  EVENING: "evening",
  STANDALONE: "standalone",
  BREAKING: "breaking",
} as const;

// Used as keys of `today_routine_progress` property of current-activity-props
export const ROUTINE_PROGRESS_KEY = {
  morning: "morning_routine",
  evening: "evening_routine",
} as const;

// Used as values of `status` property of today_routine_progress[key]
export const ROUTINE_STATUS = {
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress",
  POSTPONED: "postponed",
} as const;

export const ROUTINE_TRIGGER = {
  ON_DEMAND: "ON_DEMAND",
  ON_SCHEDULE: "ON_SCHEDULE",
} as const;

export const DEFAULT_STARTUP_TIME = "05:00";
export const DEFAULT_SHUTDOWN_TIME = "17:00";
export const DEFAULT_CUTOFF_TIME = "22:00";
export const DEFAULT_BREAK_AFTER_MINUTES = 60;
