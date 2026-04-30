import React, { useEffect, useState } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Card, BodyMediumText, DisplaySmallText, HeadingLargeText, Space } from "@/components";
import { useTheme } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useHealthData } from "@/hooks/useHealthData";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { useTranslation } from "react-i18next";
import { useHomeContext } from "@/screens/Home/context";
import { useFontScale } from "@/hooks/use-font-scale";

const SLEEP_GOAL = 8; // 8 hours
const MOVEMENT_GOAL = 30; // 30 minutes
const STEPS_GOAL = 10000; // 10,000 steps

const HealthStats: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isLargeFontScale } = useFontScale();
  const [isExpanded, setIsExpanded] = useState(false);
  const { isPhysicalActivityPermissionDisabled } = useHomeContext();

  const { healthData, isLoading, refetch } = useHealthData();
  const {
    isHealthPermissionGranted,
    requestPermission,
    isPhysicalPermissionGranted,
    requestPhysicalActivityPermission,
  } = useHomeContext();

  if (!checkIsAndroid()) {
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isHealthPermissionGranted && (isPhysicalPermissionGranted || isPhysicalActivityPermissionDisabled)) {
      refetch();
    }
  }, [isHealthPermissionGranted, isPhysicalPermissionGranted, isPhysicalActivityPermissionDisabled]);

  const getStatusColor = (metric: string, value: number) => {
    switch (metric) {
      case "sleep":
        if (value >= 7 && value <= 9) {
          return colors.success;
        }
        if (value >= 6 && value < 7) {
          return colors.primary;
        }
        if (value >= 5 && value < 6) {
          return colors.warning;
        }
        return colors.danger;
      case "movement":
        if (value >= 30) {
          return colors.success;
        }
        if (value >= 20) {
          return colors.primary;
        }
        if (value >= 10) {
          return colors.warning;
        }
        return colors.danger;
      case "steps":
        if (value >= 10000) {
          return colors.success;
        }
        if (value >= 7500) {
          return colors.primary;
        }
        if (value >= 5000) {
          return colors.warning;
        }
        return colors.danger;
      default:
        return colors.subText;
    }
  };

  const handleToggle = () => {
    if (!isExpanded) {
      refetch();
    }
    setIsExpanded(!isExpanded);
  };

  const headerContentStyle = isLargeFontScale ? styles.headerContentWrap : styles.headerContent;
  const metricHeaderStyle = isLargeFontScale ? styles.metricHeaderWrap : styles.metricHeader;
  const metricInfoStyle = isLargeFontScale ? styles.metricInfoWrap : styles.metricInfo;

  const renderPermissionPrompt = () => (
    <>
      <Space height={12} />
      {!isHealthPermissionGranted && (
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.expandedContent}
          testID="test:id/healthstats-request-health-permission"
        >
          <Card style={styles.metricCard}>
            <View style={metricHeaderStyle}>
              <MaterialCommunityIcons name="lock" size={20} color={colors.warning} />
              <View style={metricInfoStyle}>
                <BodyMediumText>{t("healthMetrics.healthPermissionsRequired")}</BodyMediumText>
                <BodyMediumText style={[styles.subText, { color: colors.subText }]}>
                  {t("healthMetrics.tapToGrantPermissions")}
                </BodyMediumText>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      )}
      {!isPhysicalPermissionGranted && (
        <>
          <TouchableOpacity
            onPress={requestPhysicalActivityPermission}
            style={styles.expandedContent}
            testID="test:id/healthstats-request-physical-permission"
          >
            <Card style={styles.metricCard}>
              <View style={metricHeaderStyle}>
                <MaterialCommunityIcons name="lock" size={20} color={colors.warning} />
                <View style={metricInfoStyle}>
                  <BodyMediumText>{t("healthMetrics.physicalActivityPermissionsRequired")}</BodyMediumText>
                  <BodyMediumText style={[styles.subText, { color: colors.subText }]}>
                    {t("healthMetrics.tapToGrantPhysicalActivityPermissions")}
                  </BodyMediumText>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </>
      )}
    </>
  );

  const renderHealthMetrics = () => (
    <View style={styles.expandedContent}>
      <Space height={12} />

      {/* Sleep */}
      <Card style={styles.metricCard}>
        <View style={metricHeaderStyle}>
          <MaterialCommunityIcons name="sleep" size={20} color={getStatusColor("sleep", healthData.sleepHours)} />
          <View style={metricInfoStyle}>
            <BodyMediumText>{t("healthMetrics.sleep")}</BodyMediumText>
            <DisplaySmallText style={styles.metricValue}>
              {t("focusMode.hoursWithValue", { value: healthData.sleepHours.toFixed(1) })} /{" "}
              {t("focusMode.hoursWithValue", { value: SLEEP_GOAL })}
            </DisplaySmallText>
          </View>
        </View>
      </Card>

      {/* Movement */}
      <Card style={styles.metricCard}>
        <View style={metricHeaderStyle}>
          <MaterialCommunityIcons name="run" size={20} color={getStatusColor("movement", healthData.movementMinutes)} />
          <View style={metricInfoStyle}>
            <BodyMediumText>{t("healthMetrics.activeMinutes")}</BodyMediumText>
            <DisplaySmallText style={styles.metricValue}>
              {t("focusMode.minutesWithValue", { value: healthData.movementMinutes })} /{" "}
              {t("focusMode.minutesWithValue", { value: MOVEMENT_GOAL })}
            </DisplaySmallText>
          </View>
        </View>
      </Card>

      {/* Steps */}
      <Card style={styles.metricCard}>
        <View style={metricHeaderStyle}>
          <MaterialCommunityIcons name="shoe-print" size={20} color={getStatusColor("steps", healthData.stepsCount)} />
          <View style={metricInfoStyle}>
            <BodyMediumText>{t("healthMetrics.steps")}</BodyMediumText>
            <DisplaySmallText style={styles.metricValue}>
              {healthData.stepsCount.toLocaleString()} / {STEPS_GOAL.toLocaleString()}
            </DisplaySmallText>
          </View>
        </View>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.7} testID="test:id/healthstats-toggle-header">
        <Card style={styles.headerCard}>
          <View style={headerContentStyle}>
            <MaterialCommunityIcons name="heart-pulse" size={24} color={colors.primary} />
            <View style={[styles.headerText, isLargeFontScale && styles.headerTextWrap]}>
              <HeadingLargeText>{t("healthMetrics.title")}</HeadingLargeText>
              <BodyMediumText style={{ color: colors.subText }}>
                {isExpanded ? t("healthMetrics.tapToCollapse") : t("healthMetrics.tapToView")}
              </BodyMediumText>
            </View>
            <MaterialCommunityIcons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={colors.subText}
            />
          </View>
        </Card>
      </TouchableOpacity>

      {isExpanded && (
        <>
          {!isHealthPermissionGranted || !isPhysicalPermissionGranted
            ? renderPermissionPrompt()
            : renderHealthMetrics()}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <BodyMediumText style={{ color: colors.subText }}>{t("healthMetrics.loadingHealthData")}</BodyMediumText>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerCard: {
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerContentWrap: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTextWrap: {
    marginLeft: 0,
    marginTop: 4,
  },
  expandedContent: {
    paddingHorizontal: 16,
  },
  metricCard: {
    padding: 16,
    marginBottom: 8,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricHeaderWrap: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  metricInfo: {
    flex: 1,
    marginLeft: 12,
  },
  metricInfoWrap: {
    flex: 1,
    marginLeft: 0,
    marginTop: 8,
  },
  metricValue: {
    fontWeight: "600",
    marginTop: 4,
  },
  subText: {
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 16,
  },
});

export default HealthStats;
