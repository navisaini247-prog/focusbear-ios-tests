import React from "react";
import { StyleSheet } from "react-native";
import { Button, HeadingSmallText, ButtonProps, ScalableIcon } from "@/components";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

export const AddBlockButton = ({ style, ...props }: ButtonProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Button
      subtle
      style={[styles.button, { borderColor: colors.border }, style]}
      testID="test:id/add-block-button"
      {...props}
    >
      <ScalableIcon name="add" size={20} color={colors.text} iconType="Ionicons" />
      <HeadingSmallText>{t("blockingSchedule.addNewBlock")}</HeadingSmallText>
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderStyle: "dashed",
    minHeight: 48,
  },
});
