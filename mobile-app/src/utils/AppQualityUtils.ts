import { AppQuality, AppCategories, UsageStats } from "@/types/AppUsage.types";
import { store } from "@/store";
import { appQualityOverridesSelector } from "@/reducers/AppQualityReducer";
import { checkIsAndroid } from "./PlatformMethods";

// Type definitions for JSON data structure
interface AppCategorization {
  packageName: string;
  category: string;
}

interface CategorizationsData {
  apps: AppCategorization[];
}

// Type for distraction levels mapping
type DistractionLevelKey = keyof typeof AppQuality;
type DistractionLevels = {
  [K in DistractionLevelKey]: Set<string>;
};

const categoryMap = new Map<string, string>();

if (checkIsAndroid()) {
  try {
    const categorizations = require("@/data/appCategorizations.json") as CategorizationsData;
    if (categorizations && categorizations.apps && Array.isArray(categorizations.apps)) {
      categorizations.apps.forEach((app: AppCategorization) => {
        if (app.packageName && app.category) {
          const normalizedCategory = app.category.toUpperCase().startsWith("GAME_") ? "GAME" : app.category;
          categoryMap.set(app.packageName, normalizedCategory);
        }
      });
    }
  } catch (error) {
    console.warn("Failed to load app categorizations:", error);
  }
}

const DISTRACTION_LEVELS: DistractionLevels = {
  EXTREMELY_DISTRACTING: new Set([
    "GAME",
    "SOCIAL",
    "ENTERTAINMENT",
    "VIDEO_PLAYERS",
    "NEWS_AND_MAGAZINES",
    "COMICS",
    "VIDEO",
    "NEWS",
  ]),
  VERY_DISTRACTING: new Set(["DATING", "MESSAGING", "SHOPPING"]),
  SLIGHTLY_DISTRACTING: new Set(["MUSIC_AND_AUDIO", "PHOTOGRAPHY", "LIFESTYLE", "PERSONALIZATION", "AUDIO", "IMAGE"]),
  NEUTRAL: new Set([
    "TOOLS",
    "WEATHER",
    "TRAVEL_AND_LOCAL",
    "MAPS_AND_NAVIGATION",
    "AUTO_AND_VEHICLES",
    "BOOKS_AND_REFERENCE",
    "MISC",
    "MAPS",
    "ACCESSIBILITY",
  ]),
  SLIGHTLY_PRODUCTIVE: new Set(["FOOD_AND_DRINK", "HEALTH_AND_FITNESS"]),
  PRODUCTIVE: new Set(["BUSINESS", "FINANCE", "COMMUNICATION"]),
  VERY_PRODUCTIVE: new Set(["PRODUCTIVITY", "EDUCATION"]),
};

export const mapCategoryToQuality = (category: string): AppQuality => {
  const categoryUpper = category.toUpperCase();

  for (const [levelKey, categories] of Object.entries(DISTRACTION_LEVELS) as [DistractionLevelKey, Set<string>][]) {
    if (categories.has(categoryUpper)) {
      return AppQuality[levelKey];
    }
  }

  return AppQuality.NEUTRAL;
};

export const QUALITY_WEIGHTS: Record<AppQuality, number> = {
  [AppQuality.EXTREMELY_DISTRACTING]: 3,
  [AppQuality.VERY_DISTRACTING]: 2,
  [AppQuality.SLIGHTLY_DISTRACTING]: 1,
  [AppQuality.NEUTRAL]: 0,
  [AppQuality.SLIGHTLY_PRODUCTIVE]: 1,
  [AppQuality.PRODUCTIVE]: 2,
  [AppQuality.VERY_PRODUCTIVE]: 3,
};

export const getUserQualityOverrides = (): Map<string, AppQuality> => {
  const state = store.getState();
  const overrides = appQualityOverridesSelector(state);

  const overridesMap = new Map<string, AppQuality>();
  Object.entries(overrides).forEach(([packageName, quality]) => {
    if (typeof quality === "number" && quality >= 0 && quality <= 6) {
      overridesMap.set(packageName, quality as AppQuality);
    }
  });

  return overridesMap;
};

const getFallbackCategory = (category: AppCategories | number | null | undefined): string | null => {
  if (category === null || category === undefined) return null;

  const defaultCategoryMap: Record<number, string> = {
    [-1]: "MISC",
    [0]: "GAME",
    [1]: "AUDIO",
    [2]: "VIDEO",
    [3]: "IMAGE",
    [4]: "SOCIAL",
    [5]: "NEWS",
    [6]: "MAPS",
    [7]: "PRODUCTIVITY",
    [8]: "ACCESSIBILITY",
  };

  if (typeof category === "number" && category in defaultCategoryMap) {
    return defaultCategoryMap[category];
  }

  return String(category).toUpperCase();
};

export const getAppQuality = (
  packageName: string,
  androidCategory: AppCategories | number | null = null,
): AppQuality => {
  if (packageName === "com.focusbear") {
    return AppQuality.VERY_PRODUCTIVE;
  }

  const overrides = getUserQualityOverrides();
  if (overrides.has(packageName)) {
    return overrides.get(packageName)!;
  }

  const category = getAppCategory(packageName, androidCategory);
  if (category) {
    return mapCategoryToQuality(category);
  }

  return AppQuality.NEUTRAL;
};

export const calculateHighQualityScore = (appsStats: UsageStats[], appQualities: Map<string, AppQuality>): number => {
  return appsStats.reduce((acc, app) => {
    const quality = appQualities.get(app.packageName) ?? AppQuality.NEUTRAL;
    if (quality >= AppQuality.SLIGHTLY_PRODUCTIVE) {
      const weight = QUALITY_WEIGHTS[quality] ?? 0;
      return acc + app.totalTimeUsed * weight;
    }
    return acc;
  }, 0);
};

export const calculateLowQualityScore = (appsStats: UsageStats[], appQualities: Map<string, AppQuality>): number => {
  return appsStats.reduce((acc, app) => {
    const quality = appQualities.get(app.packageName) ?? AppQuality.NEUTRAL;
    if (quality <= AppQuality.SLIGHTLY_DISTRACTING) {
      const weight = QUALITY_WEIGHTS[quality] ?? 0;
      return acc + app.totalTimeUsed * weight;
    }
    return acc;
  }, 0);
};

export const calculateTotalImpact = (highQualityScore: number, lowQualityScore: number): number => {
  return highQualityScore + lowQualityScore;
};

export const calculateQualityPercentage = (score: number, totalImpact: number): number => {
  return totalImpact > 0 ? Math.round((score / totalImpact) * 100) : 0;
};

export const getAppCategory = (
  packageName: string,
  androidCategory: AppCategories | number | null = null,
): string | null => {
  // First check the detailed categorization map
  const category = categoryMap.get(packageName);
  if (category) {
    return category;
  }

  // Fall back to Android category
  if (checkIsAndroid() && androidCategory !== null && androidCategory !== undefined) {
    return getFallbackCategory(androidCategory);
  }

  return null;
};
