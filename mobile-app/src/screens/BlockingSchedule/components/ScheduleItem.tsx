import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { HeadingMediumText, BodySmallText, BodyXSmallText, Button, Text } from "@/components";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import moment from "moment";
import { EMOJI_REGEX } from "@/constants/activity";
import Icon from "react-native-vector-icons/Ionicons";
import { Schedule } from "@/screens/BlockingSchedule/hooks/useBlockingScheduleLogic";
import { BLOCKING_MODE } from "@/constants/blockingSchedule";
import { formatDaysOfWeek } from "@/utils/TimeMethods";
import { checkIsIOS } from "@/utils/PlatformMethods";

type Props = {
  schedule: Schedule;
  onPress?: () => void;
};

export function ScheduleItem({ schedule, onPress }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = t("baseLanguage", { defaultValue: "en" });

  const startLabel = moment().hours(schedule.startHour).minutes(schedule.startMinute).seconds(0).format("LT");
  const endLabel = moment().hours(schedule.endHour).minutes(schedule.endMinute).seconds(0).format("LT");

  const daysDisplay = useMemo(() => formatDaysOfWeek(schedule.daysOfWeek, locale), [schedule.daysOfWeek, locale]);

  const isStrict =
    schedule.blockingMode === BLOCKING_MODE.STRICT || schedule.blockingMode === BLOCKING_MODE.SUPER_STRICT;
  const modeBg = isStrict ? colors.warningBg : colors.successBg;
  const modeColor = isStrict ? colors.warning : colors.success;

  const hasNoBlockedApps = useMemo(() => {
    if (checkIsIOS()) {
      const applicationsCount = schedule.selectedApplicationsCount ?? 0;
      const categoriesCount = schedule.selectedCategoriesCount ?? 0;
      const webDomainsCount = schedule.selectedWebDomainsCount ?? 0;
      return applicationsCount + categoriesCount + webDomainsCount === 0;
    } else {
      const blockedPackages = schedule.blockedPackages ?? [];
      return blockedPackages.length === 0;
    }
  }, [schedule]);

  // naïve emoji detection for avatar
  const emoji = (schedule?.name || "").match(EMOJI_REGEX)?.[0];
  const name = (schedule?.name || "").replace(EMOJI_REGEX, "").trimStart();

  return (
    <Button onPress={onPress} style={[styles.gap12, styles.row]} subtle testID={`test:id/schedule-item-${schedule.id}`}>
      <Text style={[styles.emoji, { backgroundColor: colors.secondary }]}>{emoji || "💻"}</Text>
      <View style={[styles.flex, styles.gap8]}>
        <View style={styles.row}>
          <HeadingMediumText>
            {`${name} `}
            <View>
              <BodyXSmallText color={modeColor} style={[styles.pill, { backgroundColor: modeBg }]}>
                {isStrict ? t("blockingSchedule.mode.strict.title") : t("blockingSchedule.mode.gentle.title")}
              </BodyXSmallText>
            </View>
          </HeadingMediumText>
        </View>
        <BodySmallText color={colors.subText}>{`${startLabel} - ${endLabel}, ${daysDisplay}`}</BodySmallText>
        {hasNoBlockedApps && (
          <View style={styles.warningContainer}>
            <Icon name="warning-outline" size={16} color={colors.warning} />
            <BodyXSmallText color={colors.warning} style={styles.warningText}>
              {t("blockingSchedule.noAppsSelected")}
            </BodyXSmallText>
          </View>
        )}
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  emoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: "center",
    lineHeight: 48,
    fontSize: 22,
  },
  pill: {
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: -6,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  warningText: {
    marginLeft: 4,
  },
});

export default ScheduleItem;
