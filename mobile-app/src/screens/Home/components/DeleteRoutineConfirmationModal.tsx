import React from "react";
import { View, StyleSheet } from "react-native";
import { BodyLargeText, Button, Card, Modal } from "@/components";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { addInfoLog } from "@/utils/FileLogger";
import { deleteCustomRoutine } from "@/actions/RoutineActions";

interface DeleteRoutineConfirmationModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  routine: any;
  onDeleteSuccess?: () => void;
}

export const DeleteRoutineConfirmationModal = ({
  isVisible,
  setIsVisible,
  routine,
  onDeleteSuccess,
}: DeleteRoutineConfirmationModalProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onConfirm = async () => {
    try {
      dispatch(deleteCustomRoutine({ activitySequenceId: routine.activity_sequence_id }));
      setIsVisible(false);
      onDeleteSuccess?.();
    } catch (error) {
      addInfoLog("Error deleting routine:", error);
    }
  };

  if (!routine) return null;

  return (
    <Modal isVisible={isVisible} onCancel={() => setIsVisible(false)}>
      <Card style={styles.modal} noPadding>
        <View style={styles.contentContainer}>
          <BodyLargeText center weight="700">
            {t("home.deleteRoutineTitle")}
          </BodyLargeText>
          <BodyLargeText center>{t("home.deleteRoutineMessage")}</BodyLargeText>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            style={styles.flex}
            onPress={() => setIsVisible(false)}
            title={t("common.cancel")}
            testID="test:id/cancel-delete-routine-button"
          />

          <Button
            primary
            style={styles.flex}
            backgroundColor={colors.danger}
            borderColor={colors.dangerBg}
            onPress={onConfirm}
            title={t("common.delete")}
            testID="test:id/confirm-delete-routine-button"
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
});
