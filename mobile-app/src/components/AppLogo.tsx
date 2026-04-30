import React from "react";
import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { BearFaceIcon } from "@/assets";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { DisplayLargeText } from "@/components";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

export const styles = StyleSheet.create({
  verticalContentContainer: {
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  horizontalContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    alignContent: "center",
    justifyContent: "center",
    paddingBottom: 32,
  },
  logoText: {
    paddingTop: 8,
    fontSize: 32,
    fontWeight: "600",
  },
  horizontalText: {
    paddingHorizontal: 4,
    fontSize: 32,
    fontWeight: "600",
  },
});

export const VerticalAppLogo = ({ iconSize, style }: { iconSize: number; style?: StyleProp<ViewStyle> }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.verticalContentContainer, style]}>
      <BearFaceIcon width={iconSize} />
      <DisplayLargeText
        style={{
          ...styles.logoText,
          color: colors.text,
        }}
      >
        {t("common.focusBear")}
      </DisplayLargeText>
    </View>
  );
};

export const HorizontalAppLogo = ({ width = 32, style }: { width?: number; style?: StyleProp<ViewStyle> }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.horizontalContentContainer, style]}>
      <BearFaceIcon width={width} height={32} />
      <DisplayLargeText
        style={{
          ...styles.horizontalText,
          color: colors.text,
        }}
        maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}
      >
        {t("common.focusBear")}
      </DisplayLargeText>
    </View>
  );
};
