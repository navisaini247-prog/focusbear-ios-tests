import React from "react";
import { MenuItem, BodyMediumText, HeadingSmallText, InfoIcon, Tooltip } from "@/components";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet } from "react-native";
import { i18n } from "@/localization";

export const StrictnessToggle = ({ isSuperStrict, setIsSuperStrict, disabled, fromFocusing = false, ...props }) => {
  const { t } = useTranslation();
  const confirmEnableSuperStrict = () => {
    Alert.alert("", i18n.t("focusMode.confirmSuperStrictMode"), [
      { text: i18n.t("common.cancel"), style: "cancel" },
      {
        text: i18n.t("common.confirm"),
        onPress: () => setIsSuperStrict((prev) => !prev),
      },
    ]);
  };
  return (
    <MenuItem
      testID="test:id/super-strict-toggle"
      type="checkbox"
      isSelected={isSuperStrict}
      onPress={fromFocusing ? () => confirmEnableSuperStrict() : () => setIsSuperStrict((prev) => !prev)}
      disabled={disabled}
      {...props}
    >
      <HeadingSmallText style={styles.flexShrink}>{t("focusMode.superStrictMode")}</HeadingSmallText>
      <Tooltip popover={<BodyMediumText>{t("focusMode.superStrictToolTip")}</BodyMediumText>}>
        <InfoIcon testID="test:id/super-strict-tooltip" />
      </Tooltip>
    </MenuItem>
  );
};

const styles = StyleSheet.create({
  flexShrink: { flexShrink: 1 },
});
