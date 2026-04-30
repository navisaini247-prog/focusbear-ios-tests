export const STATS_TABS = {
  SCREENTIME: "screentime",
  OTHER: "other",
} as const;

export type StatsTabKey = (typeof STATS_TABS)[keyof typeof STATS_TABS];
