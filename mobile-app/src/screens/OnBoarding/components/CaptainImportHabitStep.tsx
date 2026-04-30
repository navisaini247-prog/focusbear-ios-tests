import React from "react";
import { Alert, Image, StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components";
import { BodyMediumText, HeadingXLargeText } from "@/components/Text";
import COLOR from "@/constants/color";
import ImportImage from "@/assets/captain_bear/import_img.png";
import { logAPIError } from "@/utils/FileLogger";
import { styles as sharedStyles } from "../CaptainBearIntro.styles";
import { useHabitImport } from "../hooks/useHabitImport";
import { ImagePreviewContent } from "./ImagePreviewContent";
import { IdleImportButtons, RecordingActiveButtons } from "./ImportButtons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const CaptainImportHabitStep: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const {
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
  } = useHabitImport();

  const handleConfirmImageUpload = async () => {
    if (!imagePreview) return;
    handleProcessingChange(true, "image");
    try {
      await processImageImport(imagePreview.image, imagePreview.type);
    } catch (error) {
      logAPIError("[CaptainImportHabitStep] Image processing error:", error);
      Alert.alert(t("goals.habitImport.error"), t("goals.habitImport.processingError"));
      handleProcessingChange(false, null);
    } finally {
      setImagePreview(null);
    }
  };

  const { bottom } = useSafeAreaInsets();

  if (imagePreview) {
    return (
      <View style={styles.container}>
        <ImagePreviewContent
          imagePreview={imagePreview}
          processingType={processingType}
          onCancel={() => setImagePreview(null)}
          onConfirm={handleConfirmImageUpload}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.blurbTextContainer}>
          <HeadingXLargeText center style={sharedStyles.title} color={COLOR.WHITE}>
            {t("goals.addHabitList.title")}
          </HeadingXLargeText>
        </View>

        <View style={styles.importImageWrapper}>
          <Image source={ImportImage} style={styles.importImage} resizeMode="contain" />
        </View>

        <View style={[styles.buttonContainer, { paddingBottom: bottom }]}>
          <View style={styles.buttonRow}>
            {isRecording ? (
              <RecordingActiveButtons
                isRecording={isRecording}
                formattedTime={formattedTime}
                processingType={processingType}
                colors={colors}
                t={t}
                onCancel={handleCancelRecording}
                onStop={handleStopRecording}
              />
            ) : (
              <IdleImportButtons
                isProcessing={isProcessing}
                isSourcePickerVisible={isSourcePickerVisible}
                processingType={processingType}
                colors={colors}
                t={t}
                onPickImage={showImagePicker}
                onStartRecording={handleStartRecording}
              />
            )}
          </View>

          <Button
            onPress={handleNavigateToGoals}
            disabled={isProcessing || isRecording}
            testID="test:id/import-tell-us-goals"
            style={styles.optionButton}
            backgroundColor={COLOR.GRAY[900]}
            borderColor={COLOR.DARK_BORDER_COLOR}
          >
            <View style={styles.buttonContent}>
              <Icon name="chatbubble-outline" size={24} color={COLOR.WHITE} />
              <BodyMediumText color={COLOR.WHITE} style={styles.buttonText} numberOfLines={2}>
                {t("goals.achievement_placeholder")}
              </BodyMediumText>
            </View>
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    justifyContent: "space-between",
  },
  mainContent: {
    flex: 1,
  },
  blurbTextContainer: {
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  importImageWrapper: {
    width: "100%",
    alignSelf: "center",
    marginTop: 12,
    flex: 1,
  },
  importImage: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
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
});
