import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { BodyMediumText, TextField, ConfirmationModal } from "@/components";
import { useTaskStatus, TaskStatus } from "@/hooks/useTaskStatus";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { adjustHabitsWithAI, createHabitsWithAI } from "@/actions/RoutineActions";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import Toast from "react-native-toast-message";
import type { Activity } from "@/types/Routine";

interface AdjustWithAiModalProps {
  isVisible: boolean;
  onCancel: () => void;
  activities: Activity[];
  userGoals?: string[];
  routineDurationMinutes?: number;
  onApplied: (adjusted: Activity[]) => void;
}

export const AdjustWithAiModal: React.FC<AdjustWithAiModalProps> = ({
  isVisible,
  onCancel,
  activities,
  userGoals,
  routineDurationMinutes,
  onApplied,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [feedback, setFeedback] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalHabitNames, setOriginalHabitNames] = useState<string[]>([]);

  const { startPolling } = useTaskStatus((statusData: TaskStatus) => {
    if (statusData.status === "failed") {
      setIsLoading(false);
      setError(t("routineSuggestion.aiError"));
      Toast.show({ type: "error", text1: t("routineSuggestion.aiError"), position: "bottom" });
      return;
    }
    const habits = (statusData.metadata?.result as Activity[] | undefined) ?? [];
    const createWithAiFlag = habits.map((activity: Activity) => ({
      ...activity,
      aiGenerated: !originalHabitNames.includes(activity.name),
    }));
    onApplied(createWithAiFlag);
    postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_CREATED_WITH_AI, { prompt });
    Toast.show({ type: "success", text1: t("routineSuggestion.aiSuccessMessage"), position: "bottom" });
    setIsLoading(false);
  });

  // Store original habit names when modal becomes visible
  React.useEffect(() => {
    if (isVisible) {
      setOriginalHabitNames(activities.map((a) => a.name));
    }
  }, [isVisible, activities]);

  // Fix 4: declare isEmpty once before handleConfirm so it can be reused below
  const isEmpty = activities.length === 0;

  const handleConfirm = async () => {
    if (isEmpty && !prompt.trim()) return;
    if (!isEmpty && !feedback.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // If the habit selection is empty, start the process to create a habit using AI
      if (isEmpty) {
        // Api call with user's prompt
        const response = await createHabitsWithAI(prompt, {
          userGoals,
          routineDuration: routineDurationMinutes,
        });

        // get the asyncTaskId from the response call
        const asyncTaskId = response.data.asyncTaskId;

        // use the startPolling function from the useTaskStatus hook with the task id param
        startPolling(asyncTaskId);
        return;
      } else {
        // Only send required fields to backend
        const minimalActivities = activities.map((a) => ({
          id: a.id,
          name: a.name,
          duration_seconds: a.duration_seconds,
        }));

        const adjusted = await adjustHabitsWithAI(minimalActivities, feedback, {
          userGoals,
          routineDuration: routineDurationMinutes,
        });
        // Compare new habits with original ones to detect new habits
        const adjustedWithAiFlag = adjusted.data.map((activity: Activity) => {
          const isNewHabit = !originalHabitNames.includes(activity.name);
          return {
            ...activity,
            aiGenerated: isNewHabit,
          };
        });
        onApplied(adjustedWithAiFlag);

        Toast.show({ type: "success", text1: t("routineSuggestion.aiSuccessMessage"), position: "bottom" });

        postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_ADJUST_WITH_AI, { feedback });
      }
    } catch (e) {
      setError(t("routineSuggestion.aiError"));
      Toast.show({ type: "error", text1: t("routineSuggestion.aiError"), position: "bottom" });
      setIsLoading(false); // Always clear loading on any error
    } finally {
      if (!isEmpty) {
        setIsLoading(false); // adjust path only — create path loading managed by useTaskStatus callback + catch above
      }
    }
  };

  return (
    <ConfirmationModal
      isVisible={isVisible}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmTitle={isEmpty ? t("routineSuggestion.create") : t("routineSuggestion.adjust")}
      title={isEmpty ? t("routineSuggestion.createWithAI") : t("routineSuggestion.adjustWithAI")}
      isLoading={isLoading}
      disabled={isLoading || (isEmpty ? !prompt.trim() : !feedback.trim())}
    >
      <BodyMediumText style={[styles.message, { color: colors.text }]}>
        {isEmpty ? t("routineSuggestion.aiCreatePrompt") : t("routineSuggestion.aiPrompt")}
      </BodyMediumText>
      <TextField
        multiline
        value={isEmpty ? prompt : feedback}
        onChangeText={isEmpty ? setPrompt : setFeedback}
        placeholder={t("routineSuggestion.aiPlaceholder")}
        style={styles.input}
        editable={!isLoading}
      />
      {isLoading && (
        <View style={styles.loadingRow}>
          <BodyMediumText style={styles.loadingText}>
            {isEmpty ? t("routineSuggestion.creating") : t("routineSuggestion.adjusting")}
          </BodyMediumText>
        </View>
      )}
      {error && <BodyMediumText style={[styles.errorText, { color: colors.danger }]}>{error}</BodyMediumText>}
    </ConfirmationModal>
  );
};

const styles = StyleSheet.create({
  message: {
    marginBottom: 4,
  },
  input: {
    minHeight: 100,
  },
  loadingRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: 8,
  },
  errorText: {
    marginTop: 8,
  },
});
