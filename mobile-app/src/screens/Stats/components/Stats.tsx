import React from "react";
import { Image, StyleSheet, View } from "react-native";
import PropTypes from "prop-types";
import { BodyMediumText, DisplaySmallText, Card, Space } from "@/components";
import { useAppUsage } from "../Screentime/context/AppUsageContext";
import { styles } from "../Screentime/AppUsage";
import { formatTime } from "@/utils/TimeMethods";
import { useTranslation } from "react-i18next";
import { useFontScale } from "@/hooks/use-font-scale";

type AppStatsProps = {
  cardBackground?: boolean;
};

const AppStats: React.FC<AppStatsProps> = () => {
  const { t } = useTranslation();
  const { isLargeFontScale } = useFontScale();
  const { topThreeBlockedApps, blockedAppsUsage, highQualityScore, lowQualityScore, totalImpact } = useAppUsage();

  const highQualityPercentage = totalImpact > 0 ? Math.round((highQualityScore / totalImpact) * 100) : 0;
  const lowQualityPercentage = totalImpact > 0 ? Math.round((lowQualityScore / totalImpact) * 100) : 0;

  const rowStyle = isLargeFontScale ? appUsageListStyles.columnWrap : appUsageListStyles.justifyBetweenRow;
  const cardStyle = isLargeFontScale ? [appUsageListStyles.card, appUsageListStyles.cardWrap] : appUsageListStyles.card;

  return (
    <View style={appUsageListStyles.container}>
      <Space height={8} />
      <View style={rowStyle}>
        <Card style={cardStyle}>
          <BodyMediumText style={styles.appName}>{t("appUsage.lowQualityScreenTime")}</BodyMediumText>
          <DisplaySmallText style={styles.appName}>{lowQualityPercentage}%</DisplaySmallText>
        </Card>
        <Card style={cardStyle}>
          <BodyMediumText style={styles.appName}>{t("appUsage.highQualityScreenTime")}</BodyMediumText>
          <DisplaySmallText style={styles.appName}>{highQualityPercentage}%</DisplaySmallText>
        </Card>
      </View>
      <Space height={8} />
      <View style={rowStyle}>
        <Card style={cardStyle}>
          <BodyMediumText style={styles.appName}>{t("appUsage.topBlockedApps")}</BodyMediumText>
          {topThreeBlockedApps.length > 0 ? (
            <View style={[appUsageListStyles.row, isLargeFontScale && appUsageListStyles.rowWrap]}>
              {topThreeBlockedApps.map((app) => (
                <BlockedAppIcon key={app.packageName} app={app} style={appUsageListStyles.appIconContainer} />
              ))}
            </View>
          ) : (
            <DisplaySmallText style={styles.appName}>{t("appUsage.noAppsBlocked")}</DisplaySmallText>
          )}
        </Card>
        <Card style={cardStyle}>
          <BodyMediumText style={styles.appName}>{t("appUsage.blockedAppsUsage")}</BodyMediumText>
          <DisplaySmallText style={styles.appName}>{formatTime(blockedAppsUsage)}</DisplaySmallText>
        </Card>
      </View>
    </View>
  );
};

// New component for rendering a blocked app icon
const BlockedAppIcon = ({ app, style }) => {
  if (!app?.icon || app.blockCount <= 0) {
    return null;
  }
  return (
    <View style={style}>
      <Image source={{ uri: app.icon }} style={appUsageListStyles.appIcon} />
    </View>
  );
};

BlockedAppIcon.propTypes = {
  app: PropTypes.shape({
    icon: PropTypes.string,
    blockCount: PropTypes.number,
  }),
  style: PropTypes.object,
};

const appUsageListStyles = StyleSheet.create({
  appIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 4,
  },
  appIcon: {
    width: 32,
    height: 32,
  },
  row: {
    flexDirection: "row",
  },
  rowWrap: {
    flexWrap: "wrap",
  },
  justifyBetweenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  columnWrap: {
    flexDirection: "column",
    gap: 8,
  },
  container: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  card: {
    marginRight: 8,
    flex: 1,
    alignItems: "stretch",
  },
  cardWrap: {
    marginRight: 0,
  },
});

export default AppStats;
