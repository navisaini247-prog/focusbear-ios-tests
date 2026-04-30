export const STREAK_STATES = {
  INACTIVE: "INACTIVE",
  ACTIVE: "ACTIVE",
} as const;

export type StreakIconState = keyof typeof STREAK_STATES;

export const STREAK_TYPE = {
  MORNING: "morning",
  EVENING: "evening",
  FOCUS: "focus",
} as const;

export const getStreakIconState = (count: number, completedToday: boolean): StreakIconState => {
  if (completedToday) return STREAK_STATES.ACTIVE;

  return STREAK_STATES.INACTIVE;
};
