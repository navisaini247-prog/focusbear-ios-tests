export interface UsageStats {
  packageName: string;
  appName: string;
  totalTimeUsed: number;
  lastTimeUsed: number;
  blockCount: number;
  category?: AppCategories;
  icon?: string;
}

export enum AppCategories {
  MISC = -1,
  GAME = 0,
  AUDIO = 1,
  VIDEO = 2,
  IMAGE = 3,
  SOCIAL = 4,
  NEWS = 5,
  MAPS = 6,
  PRODUCTIVITY = 7,
  ACCESSIBILITY = 8,
}

export enum AppQuality {
  EXTREMELY_DISTRACTING = 0,
  VERY_DISTRACTING = 1,
  SLIGHTLY_DISTRACTING = 2,
  NEUTRAL = 3,
  SLIGHTLY_PRODUCTIVE = 4,
  PRODUCTIVE = 5,
  VERY_PRODUCTIVE = 6,
}

export const getAppCategoryName = (category: AppCategories) => {
  return AppCategories[category];
};

export const EXCLUDED_APPS = ["com.focusbear", "com.android.launcher", "com.google.android.permissioncontroller"];

export const LOW_QUALITY_MS_THRESHOLD = 1000 * 60 * 60; // 1 hour

export const TIME_USED_AFTER_CUTOFF_THRESHOLD = 1000 * 60 * 20; // 20 minutes

export enum UsageType {
  APP = "app",
  WEBSITE = "website",
}
