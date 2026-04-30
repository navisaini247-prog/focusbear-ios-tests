import React, { useEffect } from "react";
import { View, Platform, StyleSheet, Image } from "react-native";
import { BodySmallText, HeadingSmallText, MenuItem, MenuItemProps } from "@/components";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
const isIOS = Platform.OS === "ios";

interface ChooseAppsButtonProps extends MenuItemProps {
  selectionCounts?: any;
  selectedApps?: Array<any>;
  hidePrompt?: boolean;
}

export const ChooseAppsButton = ({
  selectionCounts,
  selectedApps,
  hidePrompt,
  title,
  description,
  ...props
}: ChooseAppsButtonProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  selectedApps ||= [];
  selectionCounts ||= {};

  const hasSelectedApps = (() => {
    const { applicationsCount = 0, categoriesCount = 0, webDomainsCount = 0 } = selectionCounts;
    return isIOS ? applicationsCount + categoriesCount + webDomainsCount > 0 : selectedApps.length > 0;
  })();

  const hasAndroidThumbnails = !selectedApps?.some((app) => !app?.icon);

  const shouldHighlight = !hasSelectedApps && !hidePrompt;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (!shouldHighlight) {
      scale.value = withTiming(1, { duration: 200 });
      return;
    }

    scale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      true,
    );
  }, [shouldHighlight, scale]);

  const highlightBorderStyle = shouldHighlight ? { borderColor: colors.primary } : null;

  return (
    <Animated.View style={[shouldHighlight ? styles.highlightContainer : null, highlightBorderStyle, animatedStyle]}>
      <MenuItem icon="apps" testID="test:id/choose-apps" isLargeFontScale {...props}>
        <View style={[styles.flex, styles.gap4, styles.alignStart, styles.minWidth0]}>
          <HeadingSmallText>{title || t("blockingSchedule.chooseApps")}</HeadingSmallText>
          {hasSelectedApps ? (
            isIOS ? (
              <BodySmallText color={colors.primary}>
                {t("blockingSchedule.iOSSelectionCounts", selectionCounts)}
              </BodySmallText>
            ) : hasAndroidThumbnails ? (
              <View style={[styles.row, styles.appIconRow, { backgroundColor: colors.separator }]}>
                {selectedApps.slice(0, 8).map((item) => (
                  <View key={item.packageName} style={styles.appIconContainer}>
                    <Image source={{ uri: item.icon }} width={20} height={20} />
                  </View>
                ))}
                {selectedApps.length > 8 && <BodySmallText>{`+${selectedApps.length - 8} `}</BodySmallText>}
              </View>
            ) : (
              <BodySmallText color={colors.primary}>
                {t("blockingSchedule.androidSelectionCount", { applicationsCount: selectedApps.length })}
              </BodySmallText>
            )
          ) : (
            !hasSelectedApps && (
              <BodySmallText color={colors.subText}>
                {description || t("blockingSchedule.selectionMissing")}
              </BodySmallText>
            )
          )}
        </View>
      </MenuItem>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  highlightContainer: {
    borderWidth: 2,
    borderRadius: 16,
    overflow: "hidden",
  },
  gap4: { gap: 4 },
  minWidth0: { minWidth: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  alignStart: { alignItems: "flex-start" },
  appIconRow: {
    borderRadius: 100,
    padding: 2,
    gap: 2,
  },
  appIconContainer: {
    borderRadius: 100,
    overflow: "hidden",
  },
});
