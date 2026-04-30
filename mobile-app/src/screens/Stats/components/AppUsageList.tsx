import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet } from "react-native";
import { BodySmallText, HeadingLargeText, BodyMediumText, BodyXSmallText, HeadingSmallText } from "@/components/Text";
import { Card } from "@/components";
import { FlatList, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useAppUsage } from "../Screentime/context/AppUsageContext";
import { formatHumanizeDuration } from "@/utils/TimeMethods";
import { saveBlockedAppsPreference } from "@/utils/NativeModuleMethods";
import { TouchableOpacity } from "react-native";
import { AppCategories, AppQuality, LOW_QUALITY_MS_THRESHOLD, UsageStats } from "@/types/AppUsage.types";
import COLOR from "@/constants/color";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { blockedAppsSelector, ignoredAppsSelector } from "@/selectors/UserSelectors";
import { postUserLocalDeviceSettings, setIgnoredApp } from "@/actions/UserActions";
import Icon from "react-native-vector-icons/Ionicons";
import { useFontScale } from "@/hooks/use-font-scale";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

interface AppUsageListProps {
  onQualityPress?: (packageName: string, appName: string, icon?: string, category?: AppCategories) => void;
}

const AppUsageList: React.FC<AppUsageListProps> = ({ onQualityPress }) => {
  const { sortedAppStats } = useAppUsage();
  const { t } = useTranslation();

  return (
    <View style={appUsageListStyles.container}>
      <HeadingLargeText>{t("appUsage.dailyAppUsage")}</HeadingLargeText>
      <FlatList
        data={sortedAppStats}
        scrollEnabled={false}
        keyExtractor={(item) => item.packageName}
        style={appUsageListStyles.paddingTop}
        renderItem={({ item: stat }) => <AppUsageItem stat={stat} onQualityPress={onQualityPress} />}
        ListEmptyComponent={<EmptyList />}
      />
    </View>
  );
};

const EmptyList = () => {
  const { t } = useTranslation();
  return (
    <Card>
      <BodyMediumText>{t("appUsage.noData")}</BodyMediumText>
    </Card>
  );
};

interface AppUsageItemProps {
  stat: UsageStats;
  onQualityPress?: (packageName: string, appName: string, icon?: string, category?: AppCategories) => void;
}

const AppUsageItem = ({ stat, onQualityPress }: AppUsageItemProps) => {
  const { colors } = useTheme();
  const { isLargeFontScale } = useFontScale();
  const { formatLastUsed, appQualities, getQualityLabel, getQualityColor } = useAppUsage();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isAddingToBlockList, setIsAddingToBlockList] = useState(false);

  const blockedAppsOnServer = useSelector(blockedAppsSelector);
  const ignoredApps = useSelector(ignoredAppsSelector);

  const appQuality = appQualities.get(stat.packageName) ?? AppQuality.NEUTRAL;

  const isHighUsageOnLowQualityApp = useMemo(() => {
    if (appQuality <= AppQuality.SLIGHTLY_DISTRACTING) {
      return (
        stat.totalTimeUsed > LOW_QUALITY_MS_THRESHOLD &&
        !blockedAppsOnServer.includes(stat.packageName) &&
        !ignoredApps.includes(stat.packageName)
      );
    }
    return false;
  }, [appQuality, stat.totalTimeUsed, stat.packageName, blockedAppsOnServer, ignoredApps]);

  const handleQualityPress = () => {
    if (onQualityPress) {
      onQualityPress(stat.packageName, stat.appName, stat.icon, stat.category);
    }
  };

  const onAddToBlockList = async () => {
    setIsAddingToBlockList(true);
    const blockedApps = [...blockedAppsOnServer, stat.packageName];
    await saveBlockedAppsPreference(blockedApps);
    dispatch(postUserLocalDeviceSettings({ always_blocked_apps: blockedApps }));
    setIsAddingToBlockList(false);
  };

  const onIgnore = () => {
    dispatch(setIgnoredApp(stat.packageName));
  };

  const qualityColor = getQualityColor(appQuality, colors);
  const usageTextColor = qualityColor;

  const getDurationUnits = (totalTimeUsed: number) => {
    // Show seconds only for durations less than 1 minute
    return totalTimeUsed < 60000 ? ["s"] : ["h", "m"];
  };

  const durationUnits = getDurationUnits(stat?.totalTimeUsed || 0);

  const cardContentStyle = isLargeFontScale ? appUsageListStyles.cardContentWrap : appUsageListStyles.cardContent;
  const leftContentStyle = isLargeFontScale ? appUsageListStyles.leftContentWrap : appUsageListStyles.leftContent;
  const rightContentStyle = isLargeFontScale ? appUsageListStyles.rightContentWrap : appUsageListStyles.rightContent;
  const buttonRowStyle = isLargeFontScale ? appUsageListStyles.buttonRowWrap : appUsageListStyles.buttonRow;
  const appInfoRowStyle = appUsageListStyles.appInfoRow;

  return (
    <Card style={appUsageListStyles.card}>
      <View style={cardContentStyle}>
        <View style={leftContentStyle}>
          <View style={appInfoRowStyle}>
            <Image source={{ uri: stat.icon }} style={appUsageListStyles.appIcon} />
            <HeadingSmallText
              weight="400"
              style={appUsageListStyles.appName}
              color={colors.text}
              numberOfLines={isLargeFontScale ? 2 : 1}
            >
              {stat.appName}
            </HeadingSmallText>
          </View>
          <BodySmallText
            color={colors.subText}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={appUsageListStyles.lastUsedText}
            maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}
          >
            {formatLastUsed(stat?.lastTimeUsed)}
          </BodySmallText>
        </View>

        <View style={rightContentStyle}>
          <TouchableOpacity
            onPress={handleQualityPress}
            activeOpacity={0.7}
            style={appUsageListStyles.qualityPillContainer}
            testID={`test:id/app-quality-pill-${stat.packageName}`}
          >
            <View style={[appUsageListStyles.qualityPill, { backgroundColor: `${qualityColor}10` }]}>
              <BodyXSmallText
                size={9}
                weight="400"
                color={qualityColor}
                maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}
              >
                {getQualityLabel(appQuality)}
              </BodyXSmallText>
              <Icon name="chevron-forward" size={10} color={qualityColor} style={appUsageListStyles.chevronIcon} />
            </View>
          </TouchableOpacity>
          <BodySmallText weight="400" color={usageTextColor} maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}>
            {formatHumanizeDuration(stat?.totalTimeUsed, { maxDecimalPoints: 0, units: durationUnits })}
          </BodySmallText>
        </View>
      </View>

      {isHighUsageOnLowQualityApp && (
        <View style={[appUsageListStyles.warningContainer, { borderTopColor: colors.separator }]}>
          <BodySmallText color={colors.warning} style={appUsageListStyles.warningText}>
            {t("appUsage.lowQualityAppDetected")}
          </BodySmallText>
          <View style={buttonRowStyle}>
            <TouchableOpacity
              style={[appUsageListStyles.button, appUsageListStyles.buttonContainer]}
              disabled={isAddingToBlockList}
              onPress={onAddToBlockList}
              testID={`test:id/block-app-${stat.packageName}`}
            >
              {isAddingToBlockList ? (
                <ActivityIndicator size="small" color={colors.subText} />
              ) : (
                <BodySmallText color={COLOR.POSITIVE}>{t("appUsage.yes")}</BodySmallText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[appUsageListStyles.button, appUsageListStyles.buttonContainer]}
              disabled={isAddingToBlockList}
              onPress={onIgnore}
              testID={`test:id/ignore-app-${stat.packageName}`}
            >
              {isAddingToBlockList ? (
                <ActivityIndicator size="small" color={colors.subText} />
              ) : (
                <BodySmallText color={colors.subText}>{t("appUsage.ignore")}</BodySmallText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
  );
};

const appUsageListStyles = StyleSheet.create({
  paddingTop: {
    paddingTop: 8,
  },
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  card: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    minHeight: 64,
    paddingLeft: 0,
  },
  cardContentWrap: {
    flexDirection: "column",
    paddingLeft: 0,
    paddingVertical: 4,
  },
  leftContent: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 8,
    justifyContent: "center",
  },
  leftContentWrap: {
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 8,
    gap: 4,
  },
  appInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  appName: {
    flex: 1,
  },
  rightContent: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingVertical: 8,
    paddingRight: 8,
    paddingLeft: 8,
  },
  rightContentWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingRight: 8,
    paddingLeft: 8,
    paddingTop: 4,
    gap: 12,
  },
  qualityPillContainer: {
    marginBottom: 2,
  },
  qualityPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chevronIcon: {
    marginLeft: 4,
  },
  lastUsedText: {
    flexShrink: 1,
  },
  warningContainer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  warningText: {
    paddingBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  buttonRowWrap: {
    flexDirection: "column",
    gap: 8,
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonContainer: {
    minHeight: 40,
  },
});

export default AppUsageList;
