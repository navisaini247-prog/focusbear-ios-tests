import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BodySmallText, HeadingSmallText, MenuItem } from "@/components";

interface ChooseUrlsButtonProps {
  selectedUrls?: string[];
  hidePrompt?: boolean;
  onPress?: () => void;
}

export const ChooseUrlsButton = ({ selectedUrls, hidePrompt, ...props }: ChooseUrlsButtonProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const count = Array.isArray(selectedUrls) ? selectedUrls.length : 0;
  const hasSelectedUrls = count > 0;

  return (
    <MenuItem
      icon="web-remove"
      iconType="MaterialCommunityIcons"
      testID="test:id/choose-urls"
      isLargeFontScale
      {...props}
    >
      <View style={[styles.gap4, styles.alignStart, styles.minWidth0]}>
        <HeadingSmallText>{t("blockingSchedule.chooseUrls")}</HeadingSmallText>
        {hasSelectedUrls ? (
          <BodySmallText color={colors.primary}>{t("blockingSchedule.urlsSelectionCount", { count })}</BodySmallText>
        ) : (
          !hidePrompt && (
            <BodySmallText italic color={colors.subText}>
              {t("blockingSchedule.urlsSelectionMissing")}
            </BodySmallText>
          )
        )}
      </View>
    </MenuItem>
  );
};

const styles = StyleSheet.create({
  gap4: { gap: 4 },
  alignStart: { alignItems: "flex-start" },
  minWidth0: { minWidth: 0 },
});
