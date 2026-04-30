import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components";
import { BodyMediumText, HeadingXLargeText } from "@/components/Text";
import COLOR from "@/constants/color";
import { styles as sharedStyles } from "../CaptainBearIntro.styles";
import type { ImagePreview, ProcessingType } from "../hooks/useHabitImport";

type Props = {
  imagePreview: ImagePreview;
  processingType: ProcessingType;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Displays a preview of the selected image with confirm/cancel actions.
 */
export const ImagePreviewContent: React.FC<Props> = ({ imagePreview, processingType, onCancel, onConfirm }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={styles.previewContainer}>
      <View style={styles.blurbTextContainer}>
        <HeadingXLargeText center style={sharedStyles.title} color={COLOR.WHITE}>
          {t("goals.addHabitList.confirmScreenshotUpload")}
        </HeadingXLargeText>
      </View>

      <View style={styles.imagePreviewContainer}>
        <Image source={{ uri: imagePreview.image }} style={styles.imagePreviewImage} resizeMode="cover" />
      </View>

      <View style={[styles.previewButtonsRow, { marginBottom: Math.max(32, bottom + 12) }]}>
        <Button
          onPress={onCancel}
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
          onPress={onConfirm}
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
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  blurbTextContainer: {
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 8,
  },
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
  previewButtonsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
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
