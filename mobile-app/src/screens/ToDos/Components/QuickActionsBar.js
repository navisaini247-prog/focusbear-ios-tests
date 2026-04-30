import { BodySmallText, Card, HeadingMediumText, Modal, PressableWithFeedback, Space } from "@/components";
import { checkIsFreemium, showFreemiumAlert } from "@/hooks/use-is-freemium";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNewTask } from "./AddTaskPanel";
import { useNavigation } from "@react-navigation/native";

export const QuickActionsBar = ({
  onUpload,
  onToggleRecord,
  isRecording,
  formattedTime,
  onOpenOcr,
  isAudioProcessing,
  isImageProcessing,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const { task } = useNewTask();

  const handleMicPress = () => {
    if (isAudioProcessing) return; // Prevent interaction during processing

    if (isRecording) {
      onToggleRecord && onToggleRecord();
      return;
    }

    if (checkIsFreemium()) {
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_AUDIO_FREEMIUM_BLOCKED);
      showFreemiumAlert(t("toDos.quickActions.upgradeRequired"), t("toDos.quickActions.upgradeMessage"), navigation);
      return;
    }

    setOptionsVisible(true);
  };

  const handleOcrPress = () => {
    if (isImageProcessing) return; // Prevent interaction during processing

    if (checkIsFreemium()) {
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_OCR_FREEMIUM_BLOCKED);
      showFreemiumAlert(t("toDos.quickActions.upgradeRequired"), t("toDos.quickActions.ocrUpgradeMessage"), navigation);
      return;
    }

    onOpenOcr && onOpenOcr();
  };

  const handleUploadPress = () => {
    setOptionsVisible(false);
    // Wait for modal animation to complete (200ms) plus a small buffer
    setTimeout(() => {
      onUpload && onUpload();
    }, 500);
  };

  const handleRecordPress = () => {
    setOptionsVisible(false);
    onToggleRecord && onToggleRecord();
  };

  if (task.title.trim() && !isRecording) return null;

  return (
    <View style={styles.container}>
      <PressableWithFeedback
        onPress={handleMicPress}
        style={styles.actionButton}
        disabled={isAudioProcessing}
        testID="test:id/quickaction-mic"
      >
        {isAudioProcessing ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Icon name={isRecording ? "stop" : "mic"} size={22} color={colors.subText} />
        )}
      </PressableWithFeedback>
      {isRecording && <BodySmallText weight="700">{formattedTime}</BodySmallText>}

      {!isRecording && !isAudioProcessing && (
        <PressableWithFeedback
          onPress={handleOcrPress}
          style={styles.actionButton}
          disabled={isImageProcessing}
          testID="test:id/quickaction-ocr"
        >
          {isImageProcessing ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Icon name="camera" size={22} color={colors.subText} />
          )}
        </PressableWithFeedback>
      )}

      <Modal isVisible={optionsVisible} onCancel={() => setOptionsVisible(false)}>
        <Card noPadding style={styles.modalCard}>
          <HeadingMediumText center>{t("toDos.quickActions.audio")}</HeadingMediumText>
          <Space height={12} />
          <PressableWithFeedback
            onPress={handleUploadPress}
            style={styles.modalButton}
            testID="test:id/quickaction-upload"
          >
            <BodySmallText>{t("toDos.quickActions.uploadAudio")}</BodySmallText>
          </PressableWithFeedback>
          <PressableWithFeedback
            onPress={handleRecordPress}
            style={styles.modalButton}
            testID="test:id/quickaction-record"
          >
            <BodySmallText>{t("toDos.quickActions.recordAudio")}</BodySmallText>
          </PressableWithFeedback>
          <PressableWithFeedback
            onPress={() => setOptionsVisible(false)}
            style={styles.modalButton}
            testID="test:id/quickaction-cancel"
          >
            <BodySmallText>{t("common.cancel")}</BodySmallText>
          </PressableWithFeedback>
        </Card>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  modalCard: {
    borderRadius: 16,
    padding: 8,
    paddingTop: 16,
  },
  modalButton: {
    padding: 12,
  },
});

export default QuickActionsBar;
