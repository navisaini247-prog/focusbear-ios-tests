import React from "react";
import { StyleSheet, ScrollView, Dimensions, View } from "react-native";
import { Button, ConfirmationButtonProps, Modal, Card, Group, HeadingLargeText, BodyLargeText } from "./";
import { ModalProps } from "./Modal";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useFontScale } from "@/hooks/use-font-scale";

interface ConfirmationModalProps extends Omit<ModalProps, "children">, Omit<ConfirmationButtonProps, "onCancel"> {
  children?: React.ReactNode;
  title?: string;
  text?: string;
  actionRequired?: boolean;
  confirmDisabled?: boolean;
  confirmTestID?: string;
  cancelTestID?: string;
  cancelDisabled?: boolean;
}

/**
 ** A modal with optional title, text, and buttons, and/or children.
 ** Children are rendered in a <Group> component.
 ** onCancel is required, onConfirm is optional.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  onConfirm,
  onCancel,
  confirmTitle,
  cancelTitle,
  title,
  text,
  isLoading,
  children,
  actionRequired,
  confirmDisabled,
  confirmTestID,
  cancelTestID,
  cancelDisabled,
  ...props
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isLargeFontScale } = useFontScale();

  return (
    <Modal {...(!actionRequired && { onCancel })} {...props}>
      <View style={[styles.modalWrapper, { backgroundColor: colors.card }]}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Group>
            {title && (
              <Card style={styles.titleContainer}>
                <HeadingLargeText center>{title}</HeadingLargeText>
              </Card>
            )}
            <Card style={styles.contentContainer}>
              {text && <BodyLargeText>{text}</BodyLargeText>}
              {children}
            </Card>
          </Group>
        </ScrollView>

        <View
          style={[
            styles.buttonContainer,
            isLargeFontScale && styles.buttonContainerColumn,
            { backgroundColor: colors.card, borderTopColor: colors.separator },
            styles.buttonContainerBorder,
          ]}
        >
          {isLargeFontScale && onConfirm && (
            <Button
              primary
              style={[styles.confirmationButton, styles.stackedButton]}
              onPress={onConfirm}
              title={confirmTitle || t("common.ok")}
              testID={confirmTestID || "test:id/modal-confirm"}
              isLoading={isLoading}
              titleNumberOfLines={2}
              disabled={confirmDisabled}
            />
          )}
          <Button
            style={[styles.confirmationButton, isLargeFontScale && styles.stackedButton]}
            onPress={onCancel}
            title={cancelTitle || t("common.cancel")}
            testID={cancelTestID || "test:id/modal-cancel"}
            titleNumberOfLines={2}
            disabled={cancelDisabled}
          />
          {!isLargeFontScale && onConfirm && (
            <Button
              primary
              style={styles.confirmationButton}
              onPress={onConfirm}
              title={confirmTitle || t("common.ok")}
              testID={confirmTestID || "test:id/modal-confirm"}
              isLoading={isLoading}
              titleNumberOfLines={2}
              disabled={confirmDisabled}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    borderRadius: 16,
    paddingTop: 16,
  },
  confirmationButton: {
    flexGrow: 1,
    minWidth: 120,
  },
  contentContainer: {
    minHeight: 64,
    gap: 12,
    borderBottomWidth: 0,
  },
  buttonContainerBorder: {
    borderTopWidth: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 16,
  },
  buttonContainerColumn: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  modalWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  stackedButton: {
    width: "100%",
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
});
