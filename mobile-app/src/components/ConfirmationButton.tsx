import React from "react";
import { StyleSheet } from "react-native";
import { Button } from "@/components";
import { SafeAreaView, SafeAreaViewProps } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

export interface ConfirmationButtonProps extends SafeAreaViewProps {
  confirmTitle?: string;
  confirmTestID?: string;
  onConfirm?: () => void;
  cancelTitle?: string;
  cancelTestID?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 ** Simple footer with one or two buttons.
 ** Provide onConfirm and/or onCancel functions to decide which buttons are shown.
 ** The 'cancel' button will be on the left, and 'confirm' on the right.
 */
export const ConfirmationButton: React.FC<ConfirmationButtonProps> = ({
  confirmTitle,
  confirmTestID,
  onConfirm,
  cancelTitle,
  cancelTestID,
  onCancel,
  isLoading,
  disabled,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.separator }, style]}
      {...props}
    >
      {onCancel && (
        <Button
          style={styles.button}
          onPress={onCancel}
          title={cancelTitle || t("common.cancel")}
          testID={cancelTestID || "test:id/cancel"}
          titleNumberOfLines={2}
        />
      )}
      {onConfirm && (
        <Button
          primary
          style={styles.button}
          onPress={onConfirm}
          title={confirmTitle || t("common.ok")}
          testID={confirmTestID || "test:id/confirm"}
          titleNumberOfLines={2}
          {...{ isLoading, disabled }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    minWidth: 120,
  },
});
