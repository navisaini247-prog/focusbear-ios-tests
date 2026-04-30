export const HOME_TABS = {
  OVERVIEW: "overview",
  HABIT: "habit",
  TASK: "task",
} as const;

export type HomeTabKey = (typeof HOME_TABS)[keyof typeof HOME_TABS];
