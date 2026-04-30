import React from "react";
import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

import { Button } from "@/components";
import { BodyMediumText } from "@/components/Text";
import COLOR from "@/constants/color";

type IdleImportButtonsProps = {
  isProcessing: boolean;
  isSourcePickerVisible?: boolean;
  processingType: "image" | "audio" | null;
  colors: { [key: string]: string };
  t: (key: string) => string;
  onPickImage: () => void;
  onStartRecording: () => void;
};

/**
 * Import option buttons shown when not recording: pick image or start voice note.
 */
export const IdleImportButtons: React.FC<IdleImportButtonsProps> = ({
  isProcessing,
  isSourcePickerVisible = false,
  processingType,
  colors,
  t,
  onPickImage,
  onStartRecording,
}) => (
  <>
    <Button
      onPress={onPickImage}
      disabled={isProcessing || isSourcePickerVisible}
      isLoading={processingType === "image"}
      testID="test:id/import-from-image-step"
      style={styles.horizontalButton}
      backgroundColor={COLOR.GRAY[900]}
      borderColor={COLOR.DARK_BORDER_COLOR}
    >
      <View style={styles.buttonContent}>
        <Icon name="image-outline" size={24} color={COLOR.WHITE} />
        <BodyMediumText color={COLOR.WHITE} style={styles.buttonText} numberOfLines={2}>
          {t("goals.addHabitList.uploadScreenshot")}
        </BodyMediumText>
      </View>
    </Button>

    <View style={[styles.orDivider, { backgroundColor: colors.border }]} />

    <Button
      onPress={onStartRecording}
      disabled={isProcessing}
      isLoading={processingType === "audio"}
      testID="test:id/import-from-voice-step"
      style={styles.horizontalButton}
      backgroundColor={COLOR.GRAY[900]}
      borderColor={COLOR.DARK_BORDER_COLOR}
    >
      <View style={styles.buttonContent}>
        <Icon name="mic-outline" size={20} color={COLOR.WHITE} />
        <BodyMediumText color={COLOR.WHITE} style={styles.buttonText} numberOfLines={2}>
          {t("goals.addHabitList.recordVoiceNote")}
        </BodyMediumText>
      </View>
    </Button>
  </>
);

type RecordingActiveButtonsProps = {
  isRecording: boolean;
  formattedTime: string;
  processingType: "image" | "audio" | null;
  colors: { [key: string]: string };
  t: (key: string) => string;
  onCancel: () => void;
  onStop: () => void;
};

/**
 * Buttons shown while recording is active: cancel or stop and process.
 */
export const RecordingActiveButtons: React.FC<RecordingActiveButtonsProps> = ({
  isRecording,
  formattedTime,
  processingType,
  colors,
  t,
  onCancel,
  onStop,
}) => (
  <>
    <Button
      onPress={onCancel}
      testID="test:id/cancel-recording"
      style={[styles.horizontalButton, { backgroundColor: colors.blue }]}
      borderColor={COLOR.DARK_BORDER_COLOR}
    >
      <View style={styles.buttonContent}>
        <Icon name="close" size={20} color={COLOR.WHITE} />
        <BodyMediumText color={COLOR.WHITE} style={styles.buttonText} numberOfLines={2}>
          {t("goals.habitImport.cancelRecording")}
        </BodyMediumText>
      </View>
    </Button>

    <View style={[styles.orDivider, { backgroundColor: colors.border }]} />

    <Button
      onPress={onStop}
      isLoading={processingType === "audio"}
      testID="test:id/import-from-voice-step"
      style={[
        styles.horizontalButton,
        isRecording ? { backgroundColor: colors.danger } : { backgroundColor: colors.success },
      ]}
      backgroundColor={COLOR.GRAY[900]}
      borderColor={COLOR.DARK_BORDER_COLOR}
    >
      <View style={styles.buttonContent}>
        <Icon name={isRecording ? "stop-circle" : "mic-outline"} size={20} color={COLOR.WHITE} />
        <BodyMediumText color={COLOR.WHITE} style={styles.buttonText} numberOfLines={2}>
          {t("goals.habitImport.stopRecording")}
        </BodyMediumText>
        {isRecording && (
          <BodyMediumText color={COLOR.WHITE} style={styles.buttonText}>
            {formattedTime}
          </BodyMediumText>
        )}
      </View>
    </Button>
  </>
);

const styles = StyleSheet.create({
  horizontalButton: {
    flex: 1,
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
});
