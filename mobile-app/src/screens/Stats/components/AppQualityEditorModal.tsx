import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Modal } from "@/components/Modal";
import { Card, Button } from "@/components";
import { BodyMediumText, BodySmallText } from "@/components/Text";
import { AppCategories, AppQuality } from "@/types/AppUsage.types";
import { getAppQuality } from "@/utils/AppQualityUtils";
import { setAppQualityOverride } from "@/actions/AppQualityActions";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import Slider from "@react-native-community/slider";
import LinearGradient from "react-native-linear-gradient";
import { QualityDescription } from "./QualityDescription";
import { useAppUsage } from "../Screentime/context/AppUsageContext";

interface AppQualityEditorModalProps {
  visible: boolean;
  onClose: () => void;
  packageName: string | null;
  appName: string | null;
  appIcon?: string;
  category?: AppCategories;
}

export const AppQualityEditorModal: React.FC<AppQualityEditorModalProps> = ({
  visible,
  onClose,
  packageName,
  appName,
  appIcon,
  category,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { getQualityColor } = useAppUsage();
  const dispatch = useDispatch();
  const [selectedQuality, setSelectedQuality] = useState<AppQuality>(AppQuality.NEUTRAL);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && packageName) {
      setIsSaving(false);
      const quality = getAppQuality(packageName, category);
      setSelectedQuality(quality);
    }
  }, [visible, packageName, category]);

  const handleSave = () => {
    if (!packageName) return;

    setIsSaving(true);
    try {
      dispatch(setAppQualityOverride(packageName, selectedQuality));
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.warn("Failed to save quality override:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getQualityDescription = (quality: AppQuality): string => {
    switch (quality) {
      case AppQuality.EXTREMELY_DISTRACTING:
        return t("appUsage.qualityDescription.veryDistracting");
      case AppQuality.VERY_DISTRACTING:
        return t("appUsage.qualityDescription.distracting");
      case AppQuality.SLIGHTLY_DISTRACTING:
        return t("appUsage.qualityDescription.slightlyDistracting");
      case AppQuality.NEUTRAL:
        return t("appUsage.qualityDescription.neutral");
      case AppQuality.SLIGHTLY_PRODUCTIVE:
        return t("appUsage.qualityDescription.slightlyProductive");
      case AppQuality.PRODUCTIVE:
        return t("appUsage.qualityDescription.productive");
      case AppQuality.VERY_PRODUCTIVE:
        return t("appUsage.qualityDescription.veryProductive");
      default:
        return "";
    }
  };

  if (!packageName || !appName) {
    return null;
  }

  return (
    <Modal isVisible={visible} onCancel={onClose}>
      <Card style={[styles.modalCard, { backgroundColor: colors.card }]}>
        <View style={styles.content}>
          {/* Compact Header */}
          <View style={styles.header}>
            {appIcon && <Image source={{ uri: appIcon }} style={styles.appIcon} />}
            <View style={styles.headerText}>
              <BodyMediumText style={[styles.appName, { color: colors.text }]}>{appName}</BodyMediumText>
              <BodySmallText style={{ color: colors.subText }}>{t("appUsage.howDistractingIsThisApp")}</BodySmallText>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <BodySmallText style={[styles.description, { color: colors.subText }]}>
              <QualityDescription quality={selectedQuality} description={getQualityDescription(selectedQuality)} />
            </BodySmallText>
          </View>

          {/* Slider with Gradient */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <LinearGradient
                colors={[
                  getQualityColor(AppQuality.EXTREMELY_DISTRACTING),
                  getQualityColor(AppQuality.VERY_DISTRACTING),
                  getQualityColor(AppQuality.SLIGHTLY_DISTRACTING),
                  getQualityColor(AppQuality.NEUTRAL),
                  getQualityColor(AppQuality.SLIGHTLY_PRODUCTIVE),
                  getQualityColor(AppQuality.PRODUCTIVE),
                  getQualityColor(AppQuality.VERY_PRODUCTIVE),
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sliderGradient}
              />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={6}
                step={1}
                value={selectedQuality}
                onValueChange={(value) => setSelectedQuality(Math.round(value) as AppQuality)}
                minimumTrackTintColor="transparent"
                maximumTrackTintColor="transparent"
                thumbTintColor={getQualityColor(selectedQuality, colors)}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              primary
              title={t("appUsage.save")}
              onPress={handleSave}
              isLoading={isSaving}
              disabled={isSaving}
              testID="test:id/save-app-quality"
            />
          </View>
        </View>
      </Card>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalCard: {
    maxWidth: 360,
    width: "95%",
    borderRadius: 16,
    overflow: "hidden",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  appName: {
    marginBottom: 2,
  },
  descriptionContainer: {
    marginBottom: 20,
    minHeight: 70,
    justifyContent: "center",
  },
  description: {
    lineHeight: 20,
  },
  sliderContainer: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  sliderTrack: {
    position: "relative",
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  sliderGradient: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 6,
    borderRadius: 3,
  },
  slider: {
    width: "100%",
    height: 44,
    marginHorizontal: 0,
  },
  buttonContainer: {
    gap: 10,
  },
});
