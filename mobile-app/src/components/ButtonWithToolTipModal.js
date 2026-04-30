import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { BodyMediumText, BodyLargeText, Separator, InfoIcon, Modal } from "@/components";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

const ButtonWithTooltipModal = ({ modalTitle, modalDescription }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const maxHeight = height * 0.7;

  const toggleTooltip = () => setVisible((prev) => !prev);

  return (
    <>
      <TouchableOpacity onPress={toggleTooltip} hitSlop={10} testID="test:id/info-tooltip">
        <InfoIcon />
      </TouchableOpacity>
      <Modal isVisible={visible} onCancel={toggleTooltip}>
        <View style={[styles.tooltipContainer, { backgroundColor: colors.card, maxHeight }]}>
          <ScrollView
            bounces={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <BodyLargeText>{modalTitle}</BodyLargeText>
            <Separator />
            <BodyMediumText>{modalDescription}</BodyMediumText>
          </ScrollView>
          <TouchableOpacity
            onPress={toggleTooltip}
            style={styles.closeButton}
            hitSlop={10}
            testID="test:id/info-tooltip-close"
          >
            <BodyMediumText color={colors.primary}>{t("common.ok")}</BodyMediumText>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  tooltipContainer: {
    alignSelf: "center",
    padding: 16,
    borderRadius: 8,
    width: "70%",
    gap: 12,
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    gap: 12,
  },
  closeButton: {
    alignSelf: "flex-end",
  },
});

export default ButtonWithTooltipModal;
