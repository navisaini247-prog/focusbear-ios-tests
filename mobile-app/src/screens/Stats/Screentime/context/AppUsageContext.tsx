import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useUsageStats } from "@/hooks/use-usage-stats";
import moment from "moment";
import { blockedAppsSelector } from "@/selectors/UserSelectors";
import { useDispatch, useSelector } from "react-redux";
import { EXCLUDED_APPS, TIME_USED_AFTER_CUTOFF_THRESHOLD, UsageStats, AppQuality } from "@/types/AppUsage.types";
import { useTranslation } from "react-i18next";
import { APP_QUALITIES_COLORS } from "@/constants/color";
import {
  getAppQuality,
  calculateHighQualityScore,
  calculateLowQualityScore,
  calculateTotalImpact,
} from "@/utils/AppQualityUtils";
import { useIsFocused } from "@react-navigation/native";
import { cutOffTimeSelector, startUpTimeSelector } from "@/selectors/RoutineSelectors";
import { getSplitTime } from "@/utils/TimeMethods";
import { isCutoffBeforeStartup } from "@/utils/TimeMethods";
import { setTimeUsedAfterCutoffShown } from "@/actions/GlobalActions";
import {
  stopShowingUsageAfterCutoffModalSelector,
  timeUsedAfterCutoffShownDaySelector,
} from "@/selectors/GlobalSelectors";
import { ROUTINE_NAMES } from "@/constants";
import { appQualityOverridesSelector } from "@/reducers/AppQualityReducer";
import { getIsMorningOrEvening } from "@/utils/ActivityRoutineMethods";

interface AppUsageContextType {
  appsStats: UsageStats[];
  isLoading: boolean;
  sortedAppStats: Array<UsageStats>;
  formatLastUsed: (timestamp: number) => string;
  totalTimeUsed: number;
  topThreeBlockedApps: Array<UsageStats>;
  blockedAppsUsage: number;
  fetchAppStats: () => void;
  highQualityScore: number;
  lowQualityScore: number;
  totalImpact: number;
  appQualities: Map<string, AppQuality>;
  getQualityLabel: (quality: AppQuality) => string;
  getQualityColor: (quality: AppQuality, colors?: { subText?: string; text?: string }) => string;
  fetchTimeUsedAfterCutoff: () => Promise<void>;
  showTimeUsedAfterCutoffModal: boolean;
  setShowTimeUsedAfterCutoffModal: (show: boolean) => void;
  timeUsedAfterCutoff: number;
}

const AppUsageContext = createContext<AppUsageContextType | undefined>(undefined);

export const AppUsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appsStats, isLoading, fetchStats, getUsageStats } = useUsageStats();
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const blockedAppsOnServer = useSelector(blockedAppsSelector);

  const cutOffTime = useSelector(cutOffTimeSelector);
  const startUpTime = useSelector(startUpTimeSelector);
  const lastShownDay = useSelector(timeUsedAfterCutoffShownDaySelector);
  const stopShowingUsageAfterCutoffModal = useSelector(stopShowingUsageAfterCutoffModalSelector);
  const appQualityOverrides = useSelector(appQualityOverridesSelector);
  const [showTimeUsedAfterCutoffModal, setShowTimeUsedAfterCutoffModal] = useState(false);
  const [timeUsedAfterCutoff, setTimeUsedAfterCutoff] = useState(0);

  const isFocused = useIsFocused();

  const totalTimeUsed = useMemo(() => {
    return appsStats.reduce((acc, app) => acc + app.totalTimeUsed, 0);
  }, [appsStats]);

  const appQualities = useMemo(() => {
    if (appsStats.length === 0) return new Map();

    const qualitiesMap = new Map<string, AppQuality>();
    appsStats.forEach((app) => {
      const quality = getAppQuality(app.packageName, app.category);
      qualitiesMap.set(app.packageName, quality);
    });
    return qualitiesMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appsStats, appQualityOverrides]);

  const highQualityScore = useMemo(() => {
    return calculateHighQualityScore(appsStats, appQualities);
  }, [appsStats, appQualities]);

  const lowQualityScore = useMemo(() => {
    return calculateLowQualityScore(appsStats, appQualities);
  }, [appsStats, appQualities]);

  const totalImpact = useMemo(() => {
    return calculateTotalImpact(highQualityScore, lowQualityScore);
  }, [highQualityScore, lowQualityScore]);

  const sortedAppStats = useMemo(() => {
    const statsArray = appsStats.filter((app) => !EXCLUDED_APPS.includes(app.packageName) && app.appName !== "");
    return statsArray
      .filter((app) => app.totalTimeUsed > 0)
      .sort((a, b) => b.totalTimeUsed - a.totalTimeUsed)
      .slice(0, 20);
  }, [appsStats]);

  const topThreeBlockedApps = useMemo(() => {
    const sortedApps = appsStats.sort((a, b) => b.blockCount - a.blockCount).slice(0, 3);
    return sortedApps.every((app) => app.blockCount === 0) ? [] : sortedApps;
  }, [appsStats]);

  const blockedAppsUsage = useMemo(() => {
    return appsStats
      .filter((app) => blockedAppsOnServer.includes(app.packageName))
      .reduce((acc, app) => acc + app.totalTimeUsed, 0);
  }, [appsStats, blockedAppsOnServer]);

  const formatLastUsed = (timestamp: number) => {
    if (!timestamp) {
      return "N/A";
    }
    return moment(timestamp).fromNow();
  };

  const getQualityLabel = useCallback(
    (quality: AppQuality): string => {
      switch (quality) {
        case AppQuality.EXTREMELY_DISTRACTING:
          return t("appUsage.qualityLabel.extremelyDistracting");
        case AppQuality.VERY_DISTRACTING:
          return t("appUsage.qualityLabel.veryDistracting");
        case AppQuality.SLIGHTLY_DISTRACTING:
          return t("appUsage.qualityLabel.slightlyDistracting");
        case AppQuality.NEUTRAL:
          return t("appUsage.qualityLabel.neutral");
        case AppQuality.SLIGHTLY_PRODUCTIVE:
          return t("appUsage.qualityLabel.slightlyProductive");
        case AppQuality.PRODUCTIVE:
          return t("appUsage.qualityLabel.productive");
        case AppQuality.VERY_PRODUCTIVE:
          return t("appUsage.qualityLabel.veryProductive");
        default:
          return t("appUsage.qualityLabel.neutral");
      }
    },
    [t],
  );

  const getQualityColor = useCallback((quality: AppQuality, colors?: { subText?: string; text?: string }): string => {
    if (quality === AppQuality.NEUTRAL) {
      return colors?.subText || colors?.text || APP_QUALITIES_COLORS.NEUTRAL;
    }

    const qualityKey = AppQuality[quality] as keyof typeof APP_QUALITIES_COLORS;
    return APP_QUALITIES_COLORS[qualityKey] ?? APP_QUALITIES_COLORS.NEUTRAL;
  }, []);

  const fetchAppStats = useCallback(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    fetchStats(startOfDay, endOfDay);
  }, [fetchStats]);

  useEffect(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    fetchStats(startOfDay, endOfDay);
  }, [isFocused]);

  const fetchTimeUsedAfterCutoff = useCallback(async () => {
    if (!startUpTime || !cutOffTime) {
      return;
    }

    const now = new Date();
    const { hours: startHours, min: startMinutes } = getSplitTime(startUpTime);
    const { hours: cutoffHours, min: cutoffMinutes } = getSplitTime(cutOffTime);

    const startTimestamp = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      startHours,
      startMinutes,
    ).getTime();

    const cutoffTimestamp = isCutoffBeforeStartup(startUpTime, cutOffTime)
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffHours, cutoffMinutes).getTime()
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, cutoffHours, cutoffMinutes).getTime();

    const stats = await getUsageStats(cutoffTimestamp, startTimestamp);

    return stats.filter((app) => app.packageName !== "com.focusbear").reduce((acc, app) => acc + app.totalTimeUsed, 0);
  }, [fetchStats, startUpTime, cutOffTime]);

  const showTimeUsedAfterCutoff = useCallback(async () => {
    const timeUsedAfterCutoff = await fetchTimeUsedAfterCutoff();

    if (timeUsedAfterCutoff > TIME_USED_AFTER_CUTOFF_THRESHOLD) {
      dispatch(setTimeUsedAfterCutoffShown());
      setShowTimeUsedAfterCutoffModal(true);
      setTimeUsedAfterCutoff(timeUsedAfterCutoff);
    }
  }, [fetchTimeUsedAfterCutoff]);

  useEffect(() => {
    const currentDay = new Date().getDate();
    const isEveningTime = getIsMorningOrEvening() === ROUTINE_NAMES.EVENING;
    if (currentDay !== lastShownDay && isEveningTime && !stopShowingUsageAfterCutoffModal) {
      showTimeUsedAfterCutoff();
    }
  }, []);

  const value = useMemo(
    () => ({
      appsStats,
      isLoading,
      sortedAppStats,
      formatLastUsed,
      totalTimeUsed,
      topThreeBlockedApps,
      blockedAppsUsage,
      fetchAppStats,
      highQualityScore,
      lowQualityScore,
      totalImpact,
      appQualities,
      getQualityLabel,
      getQualityColor,
      fetchTimeUsedAfterCutoff,
      showTimeUsedAfterCutoffModal,
      setShowTimeUsedAfterCutoffModal,
      timeUsedAfterCutoff,
    }),
    [
      appsStats,
      isLoading,
      sortedAppStats,
      totalTimeUsed,
      topThreeBlockedApps,
      blockedAppsUsage,
      fetchAppStats,
      highQualityScore,
      lowQualityScore,
      totalImpact,
      appQualities,
      getQualityLabel,
      getQualityColor,
      fetchTimeUsedAfterCutoff,
      showTimeUsedAfterCutoffModal,
      setShowTimeUsedAfterCutoffModal,
      timeUsedAfterCutoff,
    ],
  );

  return <AppUsageContext.Provider value={value}>{children}</AppUsageContext.Provider>;
};

export const useAppUsage = () => {
  const context = useContext(AppUsageContext);
  if (context === undefined) {
    throw new Error("useAppUsage must be used within an AppUsageProvider");
  }
  return context;
};
