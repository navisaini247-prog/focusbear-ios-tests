import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from "react-native-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, Modal, Space } from "@/components";
import { BodyMediumText, HeadingMediumText } from "@/components/Text";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";
import { addInfoLog, logAPIError } from "@/utils/FileLogger";
import { useVoiceMemo } from "@/hooks/useVoiceMemo";
import { generateHabitImportUploadUrl, habitImportAsync } from "@/actions/RoutineActions";

interface HabitImportModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  onAsyncTaskCreated?: (taskId: string) => void;
  onProcessingStateChange?: (isProcessing: boolean) => void;
}

export const HabitImportModal: React.FC<HabitImportModalProps> = ({
  isVisible,
  setIsVisible,
  onAsyncTaskCreated,
  onProcessingStateChange,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);

  const { isRecording, audioPath, formattedTime, startRecording, stopRecording, setAudioPath } = useVoiceMemo();

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setIsProcessing(false);
    setAudioPath(null);
    onProcessingStateChange?.(false);
  }, [onProcessingStateChange, setAudioPath, setIsVisible]);

  const showImagePicker = () => {
    if (isProcessing) return;

    Alert.alert(t("goals.habitImport.selectSource"), t("goals.habitImport.selectImageSource"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("goals.habitImport.takePhoto"),
        onPress: () => {
          setIsVisible(false);
          setTimeout(() => {
            launchCamera(
              {
                mediaType: "photo" as MediaType,
                quality: 0.8,
                includeBase64: false,
              },
              handleImageResponse,
            );
          }, 500);
        },
      },
      {
        text: t("goals.habitImport.chooseFromGallery"),
        onPress: () =>
          launchImageLibrary(
            {
              mediaType: "photo" as MediaType,
              quality: 0.8,
              includeBase64: false,
            },
            handleImageResponse,
          ),
      },
    ]);
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorCode) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const image = response.assets[0];
      if (image.uri) {
        setIsProcessing(true);
        onProcessingStateChange?.(true);
        try {
          await processImageImport(image.uri, image.type || "image/jpeg");
          handleClose();
        } catch (error) {
          logAPIError("[HabitImport] Image processing error:", error);
          Alert.alert(t("goals.habitImport.error"), t("goals.habitImport.processingError"));
          setIsProcessing(false);
          onProcessingStateChange?.(false);
        }
      }
    }
  };

  const processImageImport = useCallback(
    async (imageUri: string, mimeType: string): Promise<void> => {
      try {
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_START, { type: "image" });
        addInfoLog("[HabitImport] Starting image upload");

        // Step 1: Get upload URL
        // Backend DTO: { mediaType: 'image' | 'audio', fileExtension: string }
        const fileExtensionFromMime = (() => {
          if (!mimeType) return "png";
          const parts = mimeType.split("/");
          if (parts.length !== 2) return "png";
          const subtype = parts[1].toLowerCase();
          if (subtype === "jpeg") return "jpg";
          return subtype || "png";
        })();

        const uploadUrlResponse = await generateHabitImportUploadUrl({
          mediaType: "image",
          fileExtension: fileExtensionFromMime,
        });

        const { uploadUrl, mediaKey } = uploadUrlResponse.data;
        addInfoLog("[HabitImport] Got upload URL:", mediaKey);

        // Step 2: Upload image
        const response = await fetch(imageUri);
        const fileBlob = await response.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: fileBlob,
          headers: {
            "Content-Type": mimeType,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
        }

        addInfoLog("[HabitImport] Image uploaded successfully");
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_SENT, { type: "image" });

        // Step 3: Notify server and get async task id
        const asyncResponse = await habitImportAsync({
          mediaKey,
          mediaType: "image",
        });

        const asyncTaskId = asyncResponse.data.asyncTaskId;
        addInfoLog("[HabitImport] Async task started:", asyncTaskId);

        // Pass task id to parent so it can handle navigation + polling
        onAsyncTaskCreated?.(asyncTaskId);
      } catch (error) {
        logAPIError("[HabitImport] processImageImport error:", error);
        throw error;
      }
    },
    [onAsyncTaskCreated],
  );

  const processAudioImport = useCallback(
    async (audioUri: string): Promise<void> => {
      try {
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_START, { type: "audio" });
        addInfoLog("[HabitImport] Starting audio upload");

        // Step 1: Get upload URL
        // Backend DTO: { mediaType: 'image' | 'audio', fileExtension: string }
        const uploadUrlResponse = await generateHabitImportUploadUrl({
          mediaType: "audio",
          fileExtension: "m4a",
        });

        const { uploadUrl, mediaKey } = uploadUrlResponse.data;
        addInfoLog("[HabitImport] Got upload URL:", mediaKey);

        // Step 2: Upload audio (mirror OCR image flow: fetch(uri) -> blob -> PUT to uploadUrl)
        const response = await fetch(audioUri);
        const fileBlob = await response.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: fileBlob,
          headers: {
            "Content-Type": "audio/m4a",
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload audio: ${uploadResponse.statusText}`);
        }

        addInfoLog("[HabitImport] Audio uploaded successfully");
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_SENT, { type: "audio" });

        // Step 3: Notify server and get async task id
        const asyncResponse = await habitImportAsync({
          mediaKey,
          mediaType: "audio",
        });

        const asyncTaskId = asyncResponse.data.asyncTaskId;
        addInfoLog("[HabitImport] Async task started:", asyncTaskId);

        // Pass task id to parent so it can handle navigation + polling
        onAsyncTaskCreated?.(asyncTaskId);
      } catch (error) {
        logAPIError("[HabitImport] processAudioImport error:", error);
        setIsProcessing(false);
        onProcessingStateChange?.(false);
        throw error;
      }
    },
    [onAsyncTaskCreated, onProcessingStateChange],
  );

  const handleStartRecording = async () => {
    const result = await startRecording();
    if (result) {
      postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_RECORDING_STARTED);
      addInfoLog("[HabitImport] Recording started:", result);
    } else {
      Alert.alert(t("goals.habitImport.error"), t("goals.habitImport.recordingError"));
    }
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    addInfoLog("[HabitImport] Recording stopped:", result);

    if (result) {
      setIsProcessing(true);
      onProcessingStateChange?.(true);
      try {
        await processAudioImport(result);
        handleClose();
      } catch (error) {
        logAPIError("[HabitImport] Audio processing error:", error);
        Alert.alert(t("goals.habitImport.error"), t("goals.habitImport.recordingError"));
        setIsProcessing(false);
        onProcessingStateChange?.(false);
      }
    }
  };

  // Auto-process audio when recording finishes
  useEffect(() => {
    if (!isRecording && audioPath && !isProcessing) {
      // Audio just finished recording
      setIsProcessing(true);
      onProcessingStateChange?.(true);
      processAudioImport(audioPath).catch((error) => {
        logAPIError("[HabitImport] Audio processing error:", error);
        Alert.alert(t("goals.habitImport.error"), t("goals.habitImport.recordingError"));
        setIsProcessing(false);
        onProcessingStateChange?.(false);
      });
    }
  }, [isRecording, audioPath, isProcessing, onProcessingStateChange, processAudioImport, t]);

  return (
    <Modal isVisible={isVisible} onCancel={handleClose}>
      <Card style={styles.card}>
        <HeadingMediumText center>{t("goals.habitImport.title")}</HeadingMediumText>
        <Space height={8} />
        <BodyMediumText center color={colors.subText}>
          {t("goals.habitImport.description")}
        </BodyMediumText>
        <Space height={24} />

        <View style={[styles.buttonContainer, { paddingBottom: bottom + 12 }]}>
          <Button onPress={showImagePicker} disabled={isProcessing || isRecording} testID="test:id/import-from-image">
            <View style={styles.buttonContent}>
              <Icon name="image-outline" size={24} color={colors.text} />
              <BodyMediumText>{t("goals.habitImport.importFromImage")}</BodyMediumText>
            </View>
          </Button>

          <Space height={12} />

          <Button
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isProcessing}
            testID="test:id/import-from-voice"
            style={isRecording ? { backgroundColor: colors.danger } : undefined}
          >
            <View style={styles.buttonContent}>
              <Icon name={isRecording ? "stop-circle" : "mic-outline"} size={24} color={colors.text} />
              <BodyMediumText>
                {isRecording ? t("goals.habitImport.stopRecording") : t("goals.habitImport.recordVoice")}
              </BodyMediumText>
              {isRecording && <BodyMediumText color={colors.subText}>{formattedTime}</BodyMediumText>}
            </View>
          </Button>
        </View>

        {isProcessing && (
          <>
            <Space height={16} />
            <BodyMediumText center color={colors.subText}>
              {t("goals.habitImport.processing")}
            </BodyMediumText>
          </>
        )}
      </Card>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 24,
    gap: 0,
  },
  buttonContainer: {
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
