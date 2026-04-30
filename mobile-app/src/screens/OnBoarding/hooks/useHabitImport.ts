import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from "react-native-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { NAVIGATION } from "@/constants";
import { useVoiceMemo } from "@/hooks/useVoiceMemo";
import { generateHabitImportUploadUrl, habitImportAsync } from "@/actions/RoutineActions";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";
import { addInfoLog, logAPIError } from "@/utils/FileLogger";
import type { ScreenNavigationProp } from "@/navigation/AppNavigator";

export type ImagePreview = {
  image: string;
  type: string;
};

export type ProcessingType = "image" | "audio" | null;

/**
 * Handles habit import logic for image and audio uploads.
 * Manages upload state, media picker interactions, and navigation after task creation.
 */
export const useHabitImport = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<ProcessingType>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const { isRecording, formattedTime, startRecording, stopRecording } = useVoiceMemo();
  const [isSourcePickerVisible, setIsSourcePickerVisible] = useState(false);

  const handleAsyncTaskCreated = useCallback(
    (asyncTaskId: string) => {
      navigation.navigate(NAVIGATION.RoutineSuggestion as any, { habitImportTaskId: asyncTaskId } as any);
    },
    [navigation],
  );

  const handleProcessingChange = useCallback((processing: boolean, type: ProcessingType = null) => {
    setIsProcessing(processing);
    setProcessingType(type);
  }, []);

  const resolveFileExtension = (mimeType: string): string => {
    if (!mimeType) return "png";
    const parts = mimeType.split("/");
    if (parts.length !== 2) return "png";
    const subtype = parts[1].toLowerCase();
    if (subtype === "jpeg") return "jpg";
    return subtype || "png";
  };

  const processImageImport = useCallback(
    async (imageUri: string, mimeType: string) => {
      try {
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_START, { type: "image" });
        addInfoLog("[useHabitImport] Starting image upload");

        const fileExtension = resolveFileExtension(mimeType);
        const uploadUrlResponse = await generateHabitImportUploadUrl({
          mediaType: "image",
          fileExtension,
        });

        const { uploadUrl, mediaKey } = uploadUrlResponse.data;
        addInfoLog("[useHabitImport] Got upload URL:", mediaKey);

        const fetchResponse = await fetch(imageUri);
        const fileBlob = await fetchResponse.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: fileBlob,
          headers: { "Content-Type": mimeType },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
        }

        addInfoLog("[useHabitImport] Image uploaded successfully");
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_SENT, { type: "image" });

        const asyncResponse = await habitImportAsync({ mediaKey, mediaType: "image" });
        const asyncTaskId = asyncResponse.data.asyncTaskId;
        addInfoLog("[useHabitImport] Async task started:", asyncTaskId);
        handleAsyncTaskCreated(asyncTaskId);
      } catch (error) {
        logAPIError("[useHabitImport] processImageImport error:", error);
        throw error;
      }
    },
    [handleAsyncTaskCreated],
  );

  const processAudioImport = useCallback(
    async (audioUri: string) => {
      try {
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_START, { type: "audio" });
        addInfoLog("[useHabitImport] Starting audio upload");

        const uploadUrlResponse = await generateHabitImportUploadUrl({
          mediaType: "audio",
          fileExtension: "m4a",
        });

        const { uploadUrl, mediaKey } = uploadUrlResponse.data;
        addInfoLog("[useHabitImport] Got upload URL:", mediaKey);

        const fetchResponse = await fetch(audioUri);
        const fileBlob = await fetchResponse.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: fileBlob,
          headers: { "Content-Type": "audio/m4a" },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload audio: ${uploadResponse.statusText}`);
        }

        addInfoLog("[useHabitImport] Audio uploaded successfully");
        postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_UPLOAD_SENT, { type: "audio" });

        const asyncResponse = await habitImportAsync({ mediaKey, mediaType: "audio" });
        const asyncTaskId = asyncResponse.data.asyncTaskId;
        addInfoLog("[useHabitImport] Async task started:", asyncTaskId);
        handleAsyncTaskCreated(asyncTaskId);
      } catch (error) {
        logAPIError("[useHabitImport] processAudioImport error:", error);
        handleProcessingChange(false, null);
        throw error;
      }
    },
    [handleAsyncTaskCreated, handleProcessingChange],
  );

  const handleImagePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorCode) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const pickedImage = response.assets[0];
      if (pickedImage.uri) {
        setImagePreview({
          image: pickedImage.uri,
          type: pickedImage.type || "image/jpeg",
        });
      }
    }
  };

  const showImagePicker = () => {
    if (isProcessing) return;
    const releaseSourcePickerLock = () => {
      setIsSourcePickerVisible(false);
    };
    if (isSourcePickerVisible) return;
    setIsSourcePickerVisible(true);

    Alert.alert(
      t("goals.habitImport.selectSource"),
      t("goals.habitImport.selectImageSource"),
      [
        { text: t("common.cancel"), style: "cancel", onPress: releaseSourcePickerLock },
        {
          text: t("goals.habitImport.takePhoto"),
          onPress: () => {
            releaseSourcePickerLock();
            launchCamera(
              { mediaType: "photo" as MediaType, quality: 0.8, includeBase64: false },
              handleImagePickerResponse,
            );
          },
        },
        {
          text: t("goals.habitImport.chooseFromGallery"),
          onPress: () => {
            releaseSourcePickerLock();
            launchImageLibrary(
              { mediaType: "photo" as MediaType, quality: 0.8, includeBase64: false },
              handleImagePickerResponse,
            );
          },
        },
      ],
      { cancelable: true, onDismiss: releaseSourcePickerLock },
    );
  };

  const handleStartRecording = async () => {
    const result = await startRecording();
    if (result) {
      postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_RECORDING_STARTED);
      addInfoLog("[useHabitImport] Recording started:", result);
    } else {
      Alert.alert(t("goals.habitImport.error"), t("goals.habitImport.recordingError"));
    }
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    addInfoLog("[useHabitImport] Recording stopped:", result);

    if (result) {
      handleProcessingChange(true, "audio");
      try {
        await processAudioImport(result);
      } catch (error) {
        logAPIError("[useHabitImport] Audio processing error:", error);
        Alert.alert(t("goals.habitImport.error"), t("goals.habitImport.recordingError"));
        handleProcessingChange(false, null);
      }
    }
  };

  const handleCancelRecording = () => {
    handleProcessingChange(false, null);
    stopRecording();
  };

  const handleNavigateToGoals = () => {
    navigation.navigate(NAVIGATION.UserAchievement);
  };

  return {
    isProcessing,
    processingType,
    imagePreview,
    setImagePreview,
    isRecording,
    formattedTime,
    isSourcePickerVisible,
    processImageImport,
    handleProcessingChange,
    showImagePicker,
    handleStartRecording,
    handleStopRecording,
    handleCancelRecording,
    handleNavigateToGoals,
  };
};
