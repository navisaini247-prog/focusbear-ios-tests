import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from "react-native-image-picker";
import { Button, Card, Modal, Space } from "@/components";
import { BodyMediumText, HeadingMediumText } from "@/components";
import Color from "color";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { generateTodoUploadImageUrl, todoImageUploaded } from "@/actions/UserActions";
import { useTaskStatus } from "@/hooks/useTaskStatus";
import Toast from "react-native-toast-message";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";

interface OcrTodoModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  onTodosExtracted: (todos: any[]) => void;
  onProcessingStateChange?: (isProcessing: boolean) => void;
}

export const OcrTodoModal: React.FC<OcrTodoModalProps> = ({
  isVisible,
  setIsVisible,
  onTodosExtracted,
  onProcessingStateChange,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const { startPolling } = useTaskStatus((statusData) => {
    if (statusData?.status === "completed" && statusData?.metadata) {
      const aiResponse = (statusData?.metadata as any)?.aiResponse;

      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_OCR_COMPLETED);
      Toast.show({
        type: "success",
        text1: t("toDos.ocr.completed"),
        text2: t("toDos.ocr.completedDesc"),
      });

      onTodosExtracted(aiResponse);
      setIsProcessing(false);
      onProcessingStateChange?.(false);
    } else if (statusData?.status === "failed") {
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_OCR_FAILED);
      setIsProcessing(false);
      onProcessingStateChange?.(false);
      Toast.show({ type: "error", text1: t("common.somethingWrong") });
    }
  });

  const handleClose = () => {
    setIsVisible(false);
    setIsProcessing(false);
    onProcessingStateChange?.(false);
  };

  const showImagePicker = () => {
    if (isProcessing) return; // Prevent multiple selections during processing

    Alert.alert(t("toDos.ocr.selectSource"), t("toDos.ocr.selectSourceDesc"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("toDos.ocr.takePhoto"),
        onPress: () => {
          setIsVisible(false);

          setTimeout(() => {
            launchCamera(
              {
                mediaType: "photo" as MediaType,
                quality: 0.8,
                includeBase64: true,
              },
              handleImageResponse,
            );
          }, 500);
        },
      },
      {
        text: t("toDos.ocr.chooseFromGallery"),
        onPress: () =>
          launchImageLibrary(
            {
              mediaType: "photo" as MediaType,
              quality: 0.8,
              includeBase64: true,
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
          await processImageWithOCR(image.uri);
          // Close modal after successfully submitting the image
          handleClose();
        } catch (error) {
          Alert.alert(t("toDos.ocr.error"), t("toDos.ocr.processingError"));
          setIsProcessing(false);
          onProcessingStateChange?.(false);
        }
      }
    }
  };

  const processImageWithOCR = async (imageUri: string): Promise<void> => {
    try {
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_OCR_UPLOAD_START);
      // Step 1: Get upload URL
      const { uploadUrl, imageKey } = await generateTodoUploadImageUrl();

      // Step 2: Upload image
      const response = await fetch(imageUri);
      const imgBlob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: imgBlob,
        headers: {
          "Content-Type": response.headers.get("content-type") || "image/png",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
      }

      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_OCR_UPLOAD_SENT);
      // Step 3: Notify server that image is uploaded
      const data = await todoImageUploaded({ imageKey });

      // Step 4: Start polling for task status
      startPolling(data.data.asyncTaskId);

      Toast.show({
        type: "info",
        text1: t("toDos.ocr.processing"),
      });
    } catch (error) {
      console.error("OCR processing error:", error);
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_OCR_FAILED);
      throw error;
    }
  };

  const iconBg = Color(colors.primary).alpha(0.1).rgb().string();
  const iconBorder = Color(colors.primaryBorder).alpha(0.2).rgb().string();

  return (
    <Modal isVisible={isVisible} onCancel={handleClose}>
      <Card noPadding style={styles.modalCard}>
        <View style={styles.alignItemsCenter}>
          <View style={[styles.iconShadowWrapper, { shadowColor: colors.black, backgroundColor: colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: iconBg, borderColor: iconBorder }]}>
              <Icon name="camera-outline" size={48} color={colors.text} />
            </View>
          </View>
        </View>
        <HeadingMediumText center style={styles.heading}>
          {t("toDos.ocr.title")}
        </HeadingMediumText>
        <BodyMediumText center style={styles.description}>
          {t("toDos.ocr.description")}
        </BodyMediumText>

        <Space height={6} />

        <Button
          primary
          style={styles.button}
          onPress={showImagePicker}
          isLoading={isProcessing}
          renderLeftIcon={<Icon name="image-outline" size={24} color={colors.white} />}
          title={isProcessing ? t("toDos.ocr.uploading") : t("toDos.ocr.capturePhoto")}
          testID="test:id/ocr-capture-button"
        />
      </Card>
    </Modal>
  );
};

const styles = StyleSheet.create({
  alignItemsCenter: { alignItems: "center" },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    gap: 15,
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
  },
  button: {
    width: "90%",
    alignSelf: "center",
  },
  iconShadowWrapper: {
    width: 70,
    height: 70,
    borderRadius: 38,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  iconContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});

export default OcrTodoModal;
