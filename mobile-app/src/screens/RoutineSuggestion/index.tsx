import { useRoute, useNavigation, useTheme } from "@react-navigation/native";
import { YoutubeIframeRef } from "react-native-youtube-iframe";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { suggestRoutine } from "../../actions/RoutineActions";
import { putUserSettings } from "@/actions/UserActions";
import { HabitPackKeys } from "@/types/HabitPacks";
import { useTranslation } from "react-i18next";
import { NAVIGATION } from "@/constants";
import { ScreenNavigationProp } from "@/navigation/AppNavigator";
import { SuccessState } from "./components/SuccessState";
import { ErrorState } from "./components/ErrorState";
import { SafeAreaView } from "react-native-safe-area-context";
import { postHogCapture } from "@/utils/Posthog";
import { useDispatch } from "react-redux";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { useTaskStatus } from "@/hooks/useTaskStatus";
import { LoadingState } from "./components/LoadingState";
import {
  DEFAULT_STARTUP_TIME,
  DEFAULT_SHUTDOWN_TIME,
  DEFAULT_CUTOFF_TIME,
  DEFAULT_BREAK_AFTER_MINUTES,
} from "@/constants/routines";
import { AxiosResponse } from "axios";
import type { Activity } from "@/types/Routine";

const DEFAULT_DURATION_MINUTES = 30;
const FALLBACK_USER_GOALS = [
  "Build healthy habits",
  "Stay focused at work",
  "🧘 Improve mental well-being (stress, sleep)",
  "🚀 Boost productivity",
];

export enum ActivityType {
  MORNING = "morning",
  EVENING = "evening",
  BREAK = "break",
}

enum RoutineState {
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
}

export interface RoutineData {
  morning_activities: Activity[];
  evening_activities: Activity[];
}

const getHabitsFromMetadata = (metadata?: Record<string, any> | null): any[] | null => {
  if (!metadata) return null;
  if (Array.isArray(metadata)) return metadata;
  if (Array.isArray((metadata as Record<string, any>).result)) {
    return (metadata as Record<string, any>).result;
  }
  return null;
};

const buildRoutineData = (habits: any[]): { routineData: RoutineData; breakActivities: any[] } => {
  const newRoutineData: RoutineData = { morning_activities: [], evening_activities: [] };
  const newBreakActivities: any[] = [];

  for (const habit of habits) {
    const activityWithDuration = {
      ...habit,
      duration_seconds: Number(habit.duration_seconds),
    };

    if (habit.activity_type === ActivityType.MORNING) {
      newRoutineData.morning_activities.push(activityWithDuration);
    } else if (habit.activity_type === ActivityType.EVENING) {
      newRoutineData.evening_activities.push(activityWithDuration);
    } else if (habit.activity_type === ActivityType.BREAK) {
      newBreakActivities.push(activityWithDuration);
    }
  }

  return {
    routineData: newRoutineData,
    breakActivities: newBreakActivities,
  };
};

export const RoutineSuggestion = () => {
  const route = useRoute();
  const navigation = useNavigation<ScreenNavigationProp>();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const params = route.params as {
    userGoals: Array<{ goal: string; isCustom: boolean }>;
    habitImportTaskId?: string;
  };

  const userGoals = useMemo(() => {
    if (params?.userGoals) {
      return params.userGoals;
    }

    return FALLBACK_USER_GOALS.map((goal) => ({
      goal,
      isCustom: false,
    }));
  }, [params?.userGoals]);

  const habitImportTaskId = params?.habitImportTaskId;

  const [routineState, setRoutineState] = useState<RoutineState>(RoutineState.LOADING);
  const [isLoading, setIsLoading] = useState(true);
  const [routineData, setRoutineData] = useState<RoutineData>({ morning_activities: [], evening_activities: [] });
  const [breakActivities, setBreakActivities] = useState<any[]>([]);
  const videoPlayerRef = useRef<YoutubeIframeRef>(null);

  const resetRoutineState = useCallback(() => {
    setRoutineData({ morning_activities: [], evening_activities: [] });
    setBreakActivities([]);
  }, []);

  const handleAsyncTaskCompletion = useCallback(
    (statusData: { status: string; metadata?: Record<string, any> | null }) => {
      if (!statusData || statusData.status === "failed") {
        postHogCapture("routine-suggestions-no-habits-suggested", {
          userGoals: userGoals.map((g) => g.goal),
        });
        setRoutineState(RoutineState.ERROR);
        setIsLoading(false);
        return;
      }

      const habits = getHabitsFromMetadata(statusData.metadata);

      if (!habits || !habits.length) {
        postHogCapture("routine-suggestions-no-habits-suggested", {
          userGoals: userGoals.map((g) => g.goal),
        });
        setRoutineState(RoutineState.ERROR);
        setIsLoading(false);
        return;
      }

      const { routineData: formattedRoutine, breakActivities: formattedBreaks } = buildRoutineData(habits);

      setRoutineData(formattedRoutine);
      setBreakActivities(formattedBreaks);
      setRoutineState(RoutineState.SUCCESS);
      setIsLoading(false);
    },
    [userGoals],
  );

  const { startPolling, stopPolling } = useTaskStatus(handleAsyncTaskCompletion);

  const generateRoutine = useCallback(async () => {
    setRoutineState(RoutineState.LOADING);
    setIsLoading(true);
    resetRoutineState();
    stopPolling();

    try {
      const result = await suggestRoutine({
        user_goals: userGoals,
        routine_duration: DEFAULT_DURATION_MINUTES,
      });

      const asyncTaskId = (result?.data as { asyncTaskId?: string })?.asyncTaskId;

      if (!asyncTaskId) {
        throw new Error("Async task identifier not found");
      }

      startPolling(asyncTaskId);
    } catch (err) {
      console.error("Error generating routine:", err);
      setRoutineState(RoutineState.ERROR);
      setIsLoading(false);
    }
  }, [resetRoutineState, startPolling, stopPolling, userGoals, navigation]);

  const saveRoutine = async () => {
    setIsLoading(true);

    try {
      const defaultSettings = {
        [HabitPackKeys.SHUTDOWN_TIME]: DEFAULT_SHUTDOWN_TIME,
        [HabitPackKeys.SLEEP_TIME]: DEFAULT_CUTOFF_TIME,
        [HabitPackKeys.STARTUP_TIME]: DEFAULT_STARTUP_TIME,
        break_after_minutes: DEFAULT_BREAK_AFTER_MINUTES,
        morning_activities: routineData.morning_activities,
        evening_activities: routineData.evening_activities,
        break_activities: breakActivities,
      };

      const result: AxiosResponse<unknown> = await dispatch(putUserSettings(defaultSettings, false));

      if (!result) {
        setIsLoading(false);
        return;
      }

      if (result.status === 200) {
        setIsLoading(false);
        navigation.replace(NAVIGATION.BlockingPermissionIntro);
        return;
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error saving routine:", err);
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_ROUTINE_SUGGESTION_CONTINUE_CLICKED, {
      state: routineState,
      morningActivitiesCount: routineData.morning_activities.length,
      eveningActivitiesCount: routineData.evening_activities.length,
    });
    saveRoutine();
  };

  const handleRetry = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_ROUTINE_SUGGESTION_RETRY_CLICKED);
    generateRoutine();
  };

  const handleGoBackToGoals = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_ROUTINE_SUGGESTION_CONTINUE_ERROR_CLICKED);
    // @ts-ignore
    navigation.replace(NAVIGATION.UserAchievement, { skipImportModal: true });
  };

  useEffect(() => {
    setRoutineState(RoutineState.LOADING);
    setIsLoading(true);
    resetRoutineState();
    stopPolling();

    if (habitImportTaskId) {
      // Coming from habit import: reuse existing polling logic with provided task id
      startPolling(habitImportTaskId);
    } else {
      // Default flow: trigger routine suggestion API which returns an async task id
      generateRoutine();
    }
  }, [habitImportTaskId]);

  useEffect(() => {
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_ROUTINE_SUGGESTION_SCREEN_OPENED, {
      userGoalsCount: userGoals.length,
    });
  }, [userGoals.length]);

  const renderContent = () => {
    switch (routineState) {
      case RoutineState.LOADING:
        return <LoadingState t={t} colors={colors} videoPlayerRef={videoPlayerRef} />;

      case RoutineState.SUCCESS:
        return (
          <SuccessState
            routineData={routineData}
            onContinue={handleContinue}
            onUpdateRoutineData={setRoutineData}
            isSaving={isLoading}
          />
        );

      case RoutineState.ERROR:
        return <ErrorState isLoading={isLoading} onRetry={handleRetry} onContinue={handleGoBackToGoals} />;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
