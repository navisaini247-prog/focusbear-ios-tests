import React from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { AnimatedSparkleButton, AnimatedSparkleButtonProps } from "@/components/AnimatedSparkleButton";

interface AiAdjustButtonProps
  extends Omit<AnimatedSparkleButtonProps, "iconName" | "title" | "testID" | "buttonStyle"> {
  hideTitle?: boolean;
}

export const AiAdjustButton: React.FC<AiAdjustButtonProps> = ({ hideTitle, style, ...props }) => {
  const { t } = useTranslation();

  return (
    <AnimatedSparkleButton
      iconName="sparkles"
      title={t("routineSuggestion.adjustWithAI")}
      hideTitle={hideTitle}
      testID="test:id/open-ai-adjust-button"
      buttonStyle={styles.button}
      style={style}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    bottom: 16,
    right: 88,
  },
});
