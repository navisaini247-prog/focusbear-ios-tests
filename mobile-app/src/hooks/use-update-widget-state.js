import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  ControlFunction,
  refreshWidgetData,
  showWidgetRoutineData,
  updateStreakWidget,
  updateBlockedMessageWidget,
  refreshAllWidgets,
  WIDGET_NEXT_HABIT_PLACEHOLDER,
} from "@/utils/NativeModuleMethods";
import { convertSecToMins } from "@/utils/TimeMethods";
import { useTranslation } from "react-i18next";
import { useHomeContext } from "@/screens/Home/context";
import { ACTIVITY_TYPE } from "@/constants/routines";
import {
  morningStreakSelector,
  eveningStreakSelector,
  focusStreakSelector,
  hasDoneDailyMorningSessionSelector,
  hasDoneDailyEveningSessionSelector,
  hasDoneDailyFocusSessionSelector,
  userLocalDeviceSettingsSelector,
} from "@/selectors/UserSelectors";
import { appThemeSelector } from "@/selectors/GlobalSelectors";
import { useIsMorningOrEvening } from "./use-current-routine-name";
import { ROUTINE_NAMES } from "@/constants";

export const useUpdateWidgetState = (nextActivity, currentRoutineType) => {
  const { t } = useTranslation();
  const { blockingReason, blockingReasonKey } = useHomeContext();
  const appTheme = useSelector(appThemeSelector) || "dark";
  const currentRoutineName = useIsMorningOrEvening();
  const isEveningTime = currentRoutineName === ROUTINE_NAMES.EVENING;

  const refreshTimerRef = useRef(null);

  const debouncedRefreshWidgetData = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      refreshWidgetData();
      refreshTimerRef.current = null;
    }, 100);
  }, []);

  // Streak data
  const morningStreak = useSelector(morningStreakSelector);
  const eveningStreak = useSelector(eveningStreakSelector);
  const focusStreak = useSelector(focusStreakSelector);
  const morningDone = useSelector(hasDoneDailyMorningSessionSelector);
  const eveningDone = useSelector(hasDoneDailyEveningSessionSelector);
  const focusDone = useSelector(hasDoneDailyFocusSessionSelector);

  // Blocked message data
  const userSettings = useSelector(userLocalDeviceSettingsSelector);
  const customBlockedMessage = checkIsAndroid()
    ? userSettings?.Android?.customBlockedPageMessage
    : userSettings?.iOS?.customBlockedPageMessage;

  // Update main focus widget (iOS)
  useEffect(() => {
    if (checkIsIOS()) {
      if (nextActivity) {
        const durationLabel = !nextActivity.completion_requirements
          ? ` (${convertSecToMins(nextActivity.duration_seconds)})`
          : "";
        ControlFunction.setNextActivityInfo(`${nextActivity.name}${durationLabel}`);
      } else if (currentRoutineType === ACTIVITY_TYPE.EVENING || isEveningTime) {
        ControlFunction.setNextActivityInfo(t("common.goToSleep"));
      } else {
        ControlFunction.setNextActivityInfo(t("focusMode.startFocusSession"));
      }
      debouncedRefreshWidgetData();
    }
  }, [nextActivity, currentRoutineType, isEveningTime, t, debouncedRefreshWidgetData]);

  // Update routine widget (Android)
  useEffect(() => {
    if (checkIsAndroid() && currentRoutineName) {
      const themeMode = appTheme;
      const whatsNextPrefix = t("widget.whatsNext");
      const defaultTexts = {
        defaultRoutine: t("widget.defaultRoutine"),
        noReasonProvided: t("widget.noReasonProvided"),
        noNextHabit: t("widget.noNextHabit"),
      };
      if (nextActivity) {
        showWidgetRoutineData(
          currentRoutineName,
          blockingReason,
          nextActivity.name,
          blockingReasonKey,
          whatsNextPrefix,
          defaultTexts,
          themeMode,
          null,
        );
      } else if (isEveningTime) {
        showWidgetRoutineData(
          currentRoutineName,
          blockingReason,
          t("common.goToSleep"),
          blockingReasonKey,
          whatsNextPrefix,
          defaultTexts,
          themeMode,
          WIDGET_NEXT_HABIT_PLACEHOLDER.GO_TO_SLEEP,
        );
      } else {
        showWidgetRoutineData(
          currentRoutineName,
          blockingReason,
          t("focusMode.startFocusSession"),
          blockingReasonKey,
          whatsNextPrefix,
          defaultTexts,
          themeMode,
          WIDGET_NEXT_HABIT_PLACEHOLDER.START_FOCUS_SESSION,
        );
      }
    }
  }, [nextActivity, currentRoutineName, blockingReason, blockingReasonKey, isEveningTime, t, appTheme]);

  // Update streak widget (Android)
  useEffect(() => {
    if (checkIsAndroid()) {
      const themeMode = appTheme;
      updateStreakWidget(
        morningStreak,
        eveningStreak,
        focusStreak,
        morningDone,
        eveningDone,
        focusDone,
        {
          title: t("widget.streakTitle"),
          morning: t("streak.morning"),
          evening: t("streak.evening"),
          focus: t("streak.focus"),
          day: t("streak.days"),
        },
        themeMode,
      );
    }
  }, [morningStreak, eveningStreak, focusStreak, morningDone, eveningDone, focusDone, appTheme, t]);

  // Update blocked message widget (Android). If the user has no custom message,
  // pick a random localized motivational quote so the widget stays in the app's language.
  useEffect(() => {
    if (checkIsAndroid()) {
      const themeMode = appTheme;
      const trimmedCustom = customBlockedMessage?.trim();
      let message = trimmedCustom || "";
      if (!trimmedCustom) {
        const quotes = t("widget.motivationalQuotes", { returnObjects: true });
        if (Array.isArray(quotes) && quotes.length > 0) {
          message = quotes[Math.floor(Math.random() * quotes.length)];
        }
      }
      updateBlockedMessageWidget(message, themeMode);
    }
  }, [customBlockedMessage, appTheme, t]);

  // Refresh all widgets on mount (Android)
  useEffect(() => {
    if (checkIsAndroid()) {
      refreshAllWidgets();
    }
  }, []);

  // Sync custom blocked message to iOS widget
  useEffect(() => {
    if (checkIsIOS()) {
      ControlFunction.saveCustomBlockedMessage?.(customBlockedMessage ?? "");
      debouncedRefreshWidgetData();
    }
  }, [customBlockedMessage, debouncedRefreshWidgetData]);

  // Sync streak data to iOS widget
  useEffect(() => {
    if (checkIsIOS()) {
      ControlFunction.setStreakData?.(
        morningStreak ?? 0,
        eveningStreak ?? 0,
        focusStreak ?? 0,
        morningDone ?? false,
        eveningDone ?? false,
        focusDone ?? false,
      );
      debouncedRefreshWidgetData();
    }
  }, [morningStreak, eveningStreak, focusStreak, morningDone, eveningDone, focusDone, debouncedRefreshWidgetData]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);
};
