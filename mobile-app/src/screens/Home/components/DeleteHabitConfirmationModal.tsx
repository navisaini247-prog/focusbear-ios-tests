import React from "react";
import { View, StyleSheet } from "react-native";
import { BodyLargeText, Button, Card, Modal } from "@/components";
import { useTheme } from "@react-navigation/native";
import { useFontScale } from "@/hooks/use-font-scale";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { addInfoLog } from "@/utils/FileLogger";
import { deleteActivity } from "@/actions/RoutineActions";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import type { Activity } from "@/types/Routine";

interface DeleteHabitConfirmationModalProps {
  visible: boolean;
  setIsVisible: (visible: boolean) => void;
  activity: Activity;
  onConfirm?: () => void;
  onDeleteSuccess?: () => void;
}

/**
 * Delete habit confirmation modal. Will delete the habit when the user confirms unless `onConfirm` is provided.
 */
export const DeleteHabitConfirmationModal = ({
  visible,
  setIsVisible,
  activity,
  onConfirm,
  onDeleteSuccess,
}: DeleteHabitConfirmationModalProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isLargeFontScale } = useFontScale();

  const onPressDelete = async () => {
    if (onConfirm) {
      onConfirm();
      setIsVisible(false);
      return;
    }

    try {
      const { id, activity_type, activity_sequence_id } = activity;
      dispatch(deleteActivity({ id, activityType: activity_type, activitySequenceId: activity_sequence_id }));
      postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_DELETE_HABIT, { screen: "homescreen" });
      setIsVisible(false);
      onDeleteSuccess?.();
    } catch (error) {
      addInfoLog("Error deleting habit:", error);
    }
  };

  if (!activity) return null;

  return (
    <Modal isVisible={visible} onCancel={() => setIsVisible(false)}>
      <Card style={styles.modal} noPadding>
        <View style={styles.contentContainer}>
          <BodyLargeText center weight="700">
            {t("home.deleteHabitTitle")}
          </BodyLargeText>
          <BodyLargeText center>{t("home.deleteHabitMessage", { habitName: activity.name })}</BodyLargeText>
        </View>

        <View style={[styles.buttonContainer, isLargeFontScale && styles.buttonContainerColumn]}>
          <Button
            style={styles.flex}
            onPress={() => setIsVisible(false)}
            title={t("common.cancel")}
            testID="test:id/cancel-delete-habit-button"
          />

          <Button
            primary
            style={styles.flex}
            backgroundColor={colors.danger}
            borderColor={colors.dangerBg}
            onPress={onPressDelete}
            title={t("common.delete")}
            testID="test:id/confirm-delete-habit-button"
          />
        </View>
      </Card>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modal: {
    borderRadius: 16,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 12,
    gap: 12,
  },
  buttonContainer: {
    padding: 8,
    flexDirection: "row",
    gap: 12,
  },
  buttonContainerColumn: {
    flexDirection: "column",
  },
});
