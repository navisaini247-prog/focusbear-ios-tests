import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Card, BodySmallText, HeadingSmallText } from "@/components";
import { VideoUrlInput } from "./VideoUrlInput";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

export const HabitVideoSetting = memo(function HabitVideoSetting({ videoUrl, setVideoUrl, description }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Card style={styles.gap8}>
      <View style={[styles.row, styles.gap12]}>
        <Icon name="logo-youtube" size={20} color={colors.subText} />
        <HeadingSmallText style={styles.flex}>{t("habitSetting.youtubeVideo")}</HeadingSmallText>
      </View>
      <View style={[styles.row, styles.gap12]}>
        <Icon name="square" size={20} color={colors.transparent} />
        <View style={[styles.flex, styles.gap8]}>
          {description && <BodySmallText color={colors.subText}>{description}</BodySmallText>}
          <VideoUrlInput videoUrl={videoUrl} setVideoUrl={setVideoUrl} />
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
