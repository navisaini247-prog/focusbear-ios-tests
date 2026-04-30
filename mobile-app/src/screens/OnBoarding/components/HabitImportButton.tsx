import React from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { AnimatedSparkleButton, AnimatedSparkleButtonProps } from "@/components/AnimatedSparkleButton";

interface HabitImportButtonProps
  extends Omit<AnimatedSparkleButtonProps, "iconName" | "title" | "testID" | "buttonStyle"> {
  hideTitle?: boolean;
}

export const HabitImportButton: React.FC<HabitImportButtonProps> = ({ hideTitle, style, ...props }) => {
  const { t } = useTranslation();

  return (
    <AnimatedSparkleButton
      iconName="cloud-upload-outline"
      title={t("goals.habitImport.title")}
      hideTitle={hideTitle}
      testID="test:id/open-habit-import-button"
      buttonStyle={styles.button}
      style={style}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
});
