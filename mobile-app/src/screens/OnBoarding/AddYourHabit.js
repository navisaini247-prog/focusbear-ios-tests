import React, { useState, useCallback } from "react";
import { View, StyleSheet, Alert, Image } from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { Button, Space } from "@/components";
import { BodyMediumText, HeadingLargeText, HeadingXLargeText } from "@/components/Text";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import Icon from "react-native-vector-icons/Ionicons";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";
import { addInfoLog, logAPIError } from "@/utils/FileLogger";
import { useVoiceMemo } from "@/hooks/useVoiceMemo";
import { generateHabitImportUploadUrl, habitImportAsync } from "@/actions/RoutineActions";
import { NAVIGATION } from "@/constants";
import { styles as baseStyles } from "./Goals.styles";
import { ImportHabit, PirateImportHabit } from "@/assets";

export function AddYourHabit({ navigation, onboardingGoals, onProcessingStateChange, onGoBack }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const juniorBearMode = useSelector((state) => state.global?.juniorBearMode) || "normal";
  const isPirate = juniorBearMode === "pirate";
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState(null); // 'image', 'audio', or null

  const { isRecording, formattedTime, startRecording, stopRecording } = useVoiceMemo();

  const handleProcessingChange = useCallback(
    (processing, type = null) => {
      setIsProcessing(processing);
      setProcessingType(type);
      onProcessingStateChange?.(processing);
    },
    [onProcessingStateChange],
  );

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
          setTimeout(() => {
            launchCamera(
              {
                mediaType: "photo",
                quality: 0.8,
                includeBase64: false,
              },
              handleImageResponse,
            );
          }, 300);
        },
      },
      {
        text: t("goals.habitImport.chooseFromGallery"),
        onPress: () =>
          launchImageLibrary(
            {
              mediaType: "photo",
              quality: 0.8,
              includeBase64: false,
            },
            handleImageResponse,
          ),
      },
    ]);
  };

  const [imagePreview, setImagePreview] = useState(null);

  const handleImageResponse = async (response) => {
    if (response.didCancel || response.errorCode) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const image = response.assets[0];
      if (image.uri) {
        setImagePreview({
          image: image.uri,
          type: image.type || "image/jpeg",
        });
      }
    }
  };

  const handleConfirmImage = async () => {
    if (!imagePreview) return;

    handleProcessingChange(true, "image");
    try {
      await processImageImport(imagePreview.image, imagePreview.type);
    } catch (error) {
      logAPIError("[AddYourHabit] Image processing error:", error);
      Alert.alert(t("goals.habitImport.error"), t("goals.habitImport.processingError"));
      handleProcessingChange(false, null);
    } finally {
      setImagePreview(null);
    }
  };

  const handleCancelImage = () => {
    setImagePreview(null);
  };

  const processImageImport = useCallback(
    async (imageUri, mimeType) => {
      try {
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_START, { type: "image" });
        addInfoLog("[AddYourHabit] Starting image upload");

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
        addInfoLog("[AddYourHabit] Got upload URL:", mediaKey);

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

        addInfoLog("[AddYourHabit] Image uploaded successfully");
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_SENT, { type: "image" });

        const asyncResponse = await habitImportAsync({
          mediaKey,
          mediaType: "image",
        });

        const asyncTaskId = asyncResponse.data.asyncTaskId;
        addInfoLog("[AddYourHabit] Async task started:", asyncTaskId);

        const goalsForSuggestion = [...onboardingGoals].filter(Boolean);
        navigation.replace(NAVIGATION.RoutineSuggestion, {
          userGoals: goalsForSuggestion,
          habitImportTaskId: asyncTaskId,
        });
      } catch (error) {
        logAPIError("[AddYourHabit] processImageImport error:", error);
        throw error;
      }
    },
    [navigation, onboardingGoals],
  );

  const processAudioImport = useCallback(
    async (audioUri) => {
      try {
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_START, { type: "audio" });
        addInfoLog("[AddYourHabit] Starting audio upload");

        const uploadUrlResponse = await generateHabitImportUploadUrl({
          mediaType: "audio",
          fileExtension: "m4a",
        });

        const { uploadUrl, mediaKey } = uploadUrlResponse.data;
        addInfoLog("[AddYourHabit] Got upload URL:", mediaKey);

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

        addInfoLog("[AddYourHabit] Audio uploaded successfully");
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_SENT, { type: "audio" });

        const asyncResponse = await habitImportAsync({
          mediaKey,
          mediaType: "audio",
        });

        const asyncTaskId = asyncResponse.data.asyncTaskId;
        addInfoLog("[AddYourHabit] Async task started:", asyncTaskId);

        const goalsForSuggestion = [...onboardingGoals].filter(Boolean);
        navigation.replace(NAVIGATION.RoutineSuggestion, {
          userGoals: goalsForSuggestion,
          habitImportTaskId: asyncTaskId,
        });
      } catch (error) {
        logAPIError("[AddYourHabit] processAudioImport error:", error);
        handleProcessingChange(false, null);
        throw error;
      }
    },
    [navigation, onboardingGoals, handleProcessingChange],
  );

  const handleStartRecording = async () => {
    const result = await startRecording();
    if (result) {
      postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_RECORDING_STARTED);
      addInfoLog("[AddYourHabit] Recording started:", result);
    } else {
      Alert.alert(t("goals.habitImport.error"), t("goals.habitImport.recordingError"));
    }
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    addInfoLog("[AddYourHabit] Recording stopped:", result);

    if (result) {
      handleProcessingChange(true, "audio");
      try {
        await processAudioImport(result);
      } catch (error) {
        logAPIError("[AddYourHabit] Audio processing error:", error);
        Alert.alert(t("goals.habitImport.error"), t("goals.habitImport.recordingError"));
        handleProcessingChange(false, null);
      }
    }
  };

  const handleOnCancelRecording = () => {
    handleProcessingChange(false, null);
    stopRecording();
  };

  return (
    <View style={baseStyles.flex}>
      {imagePreview ? (
        <View key="preview" style={[baseStyles.container, baseStyles.flex]}>
          <View style={styles.blurbTextContainer}>
            <HeadingLargeText center>{t("goals.addHabitList.confirmScreenshotUpload")}</HeadingLargeText>
            <Space height={12} />
            <BodyMediumText center color={colors.subText}>
              {t("goals.addHabitList.confirmScreenshotUploadDesc")}
            </BodyMediumText>
            <Space height={12} />
          </View>

          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imagePreview.image }} style={styles.imagePreviewImage} resizeMode="cover" />
          </View>
          <View style={styles.previewContainer}>
            <Button
              onPress={handleCancelImage}
              testID="test:id/cancel-image-upload"
              style={[styles.horizontalButton, { backgroundColor: colors.danger }]}
            >
              <View style={styles.buttonContent}>
                <Icon name="close" size={20} color={colors.white} />
                <BodyMediumText color={colors.white} style={styles.buttonText} numberOfLines={2}>
                  {t("common.cancel")}
                </BodyMediumText>
              </View>
            </Button>
            <View style={[styles.orDivider, { backgroundColor: colors.border }]} />
            <Button
              onPress={handleConfirmImage}
              testID="test:id/confirm-screenshot"
              isLoading={processingType === "image"}
              style={[styles.horizontalButton, { backgroundColor: colors.success }]}
            >
              <View style={styles.buttonContent}>
                <Icon name="checkmark-circle" size={20} color={colors.white} />
                <BodyMediumText style={styles.buttonText} numberOfLines={2}>
                  {t("common.ok")}
                </BodyMediumText>
              </View>
            </Button>
          </View>
        </View>
      ) : (
        <View key="main" style={[baseStyles.container, baseStyles.flex]}>
          <View style={styles.blurbTextContainer}>
            <HeadingXLargeText center>{t("goals.addHabitList.title")}</HeadingXLargeText>
            <Space height={12} />
            <BodyMediumText center color={colors.subText}>
              {t("goals.addHabitList.description")}
            </BodyMediumText>
            <Space height={24} />
          </View>

          <View style={styles.illustration}>
            <Image
              source={isPirate ? PirateImportHabit : ImportHabit}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          <View style={styles.optionsContainer}>
            <View style={styles.buttonRow}>
              {!isRecording ? (
                <>
                  <Button
                    onPress={showImagePicker}
                    disabled={isProcessing || isRecording}
                    isLoading={processingType === "image"}
                    testID="test:id/upload-screenshot"
                    style={styles.horizontalButton}
                  >
                    <View style={styles.buttonContent}>
                      <Icon name="image-outline" size={20} color={colors.text} />
                      <BodyMediumText style={styles.buttonText} numberOfLines={2}>
                        {t("goals.addHabitList.uploadScreenshot")}
                      </BodyMediumText>
                    </View>
                  </Button>

                  <View style={[styles.orDivider, { backgroundColor: colors.border }]} />

                  <Button
                    onPress={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isProcessing}
                    isLoading={processingType === "audio"}
                    testID="test:id/record-voice-note"
                    style={[styles.horizontalButton, isRecording && { backgroundColor: colors.danger }]}
                  >
                    <View style={styles.buttonContent}>
                      <Icon
                        name={isRecording ? "stop-circle" : "mic-outline"}
                        size={20}
                        color={isRecording ? colors.white : colors.text}
                      />
                      <BodyMediumText
                        color={isRecording ? colors.white : colors.text}
                        style={styles.buttonText}
                        numberOfLines={2}
                      >
                        {isRecording ? t("goals.habitImport.stopRecording") : t("goals.addHabitList.recordVoiceNote")}
                      </BodyMediumText>
                      {isRecording && (
                        <BodyMediumText color={colors.white} style={styles.buttonText}>
                          {formattedTime}
                        </BodyMediumText>
                      )}
                    </View>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onPress={handleOnCancelRecording}
                    testID="test:id/cancel-recording"
                    style={[styles.horizontalButton, { backgroundColor: colors.blue }]}
                  >
                    <View style={styles.buttonContent}>
                      <Icon name="close" size={20} color={colors.text} />
                      <BodyMediumText style={styles.buttonText} numberOfLines={2}>
                        {t("goals.habitImport.cancelRecording")}
                      </BodyMediumText>
                    </View>
                  </Button>

                  <View style={[styles.orDivider, { backgroundColor: colors.border }]} />

                  <Button
                    onPress={handleStopRecording}
                    isLoading={processingType === "audio"}
                    testID="test:id/record-voice-note"
                    style={[styles.horizontalButton, isRecording && { backgroundColor: colors.danger }]}
                  >
                    <View style={styles.buttonContent}>
                      <Icon
                        name={isRecording ? "stop-circle" : "mic-outline"}
                        size={20}
                        color={isRecording ? colors.white : colors.text}
                      />
                      <BodyMediumText
                        color={isRecording ? colors.white : colors.text}
                        style={styles.buttonText}
                        numberOfLines={2}
                      >
                        {t("goals.habitImport.stopRecording")}
                      </BodyMediumText>
                      {isRecording && (
                        <BodyMediumText color={colors.white} style={styles.buttonText}>
                          {formattedTime}
                        </BodyMediumText>
                      )}
                    </View>
                  </Button>
                </>
              )}
            </View>

            <Button
              onPress={onGoBack}
              disabled={isProcessing || isRecording}
              testID="test:id/tell-us-your-goals"
              style={styles.optionButton}
            >
              <View style={styles.buttonContent}>
                <Icon name="chatbubble-outline" size={24} color={colors.text} />
                <BodyMediumText style={styles.buttonText} numberOfLines={2}>
                  {t("goals.achievement_placeholder")}
                </BodyMediumText>
              </View>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    paddingHorizontal: 16,
    justifyContent: "flex-end",
    marginBottom: 32,
    gap: 12,
    marginTop: 16,
  },
  buttonRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  horizontalButton: {
    flex: 1,
    minHeight: 48,
  },
  optionButton: {
    width: "100%",
    minHeight: 48,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
    paddingVertical: 4,
  },
  buttonText: {
    textAlign: "center",
  },
  orDivider: {
    width: 1,
    alignSelf: "stretch",
  },
  illustration: {
    width: "100%",
    alignSelf: "center",
    marginTop: 12,
    flex: 1,
  },
  blurbTextContainer: {
    justifyContent: "center",
    top: 32,
  },
  previewContainer: { flexDirection: "row", gap: 12, marginBottom: 32, maxHeight: 50, alignItems: "stretch" },
  imagePreviewContainer: {
    width: "100%",
    flex: 1,
    borderRadius: 20,
    marginVertical: 40,
    alignSelf: "center",
    overflow: "hidden",
  },
  imagePreviewImage: {
    width: "100%",
    height: "100%",
  },
});
