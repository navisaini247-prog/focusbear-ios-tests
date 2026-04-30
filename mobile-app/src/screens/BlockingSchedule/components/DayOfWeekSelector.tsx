import React, { memo, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SmallButton, HeadingSmallText, Card, ScalableIcon, CardProps } from "@/components";
import { ALL, DAYS, formatWeekdays } from "@/constants/activity";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { DayOfWeek } from "@/types/Routine";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

interface DayOfWeekSelectorProps extends CardProps {
  selectedDays: DayOfWeek[];
  setSelectedDays: (days: DayOfWeek[]) => void;
}

export const DayOfWeekSelector = memo(function DayOfWeekSelector({
  selectedDays,
  setSelectedDays,
  style,
  ...props
}: DayOfWeekSelectorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = t("baseLanguage", { defaultValue: "en" });
  const dayLabels = useMemo(() => formatWeekdays(locale, "narrow"), [locale]);

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(ALL)) {
      setSelectedDays(DAYS.filter((_day) => _day !== day));
    } else if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((_day) => _day !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <Card style={[styles.gap12, style]} {...props}>
      <View style={[styles.row, styles.gap12]}>
        <ScalableIcon name="calendar" color={colors.subText} size={20} />
        <HeadingSmallText>{t("blockingSchedule.daysHeading")}</HeadingSmallText>
      </View>
      <View style={[styles.row, styles.gap12]}>
        <ScalableIcon name="square" color={colors.transparent} size={20} />
        <View style={[styles.flex, styles.row, styles.gap10]}>
          {Object.entries(dayLabels).map(([day, label]: [DayOfWeek, string]) => (
            <Day
              key={day}
              day={day}
              label={label}
              isSelected={selectedDays.includes(day) || selectedDays.includes(ALL)}
              toggleDay={toggleDay}
            />
          ))}
        </View>
      </View>
    </Card>
  );
});

const Day = ({ day, isSelected, label, toggleDay }) => {
  const { colors } = useTheme();
  return (
    <SmallButton primary={isSelected} style={styles.dayButton} onPress={() => toggleDay(day)}>
      <HeadingSmallText color={isSelected ? colors.white : colors.subText} weight={isSelected ? "700" : "300"} maxFontSizeMultiplier={FONT_SCALE_LIMIT.FIXED_LAYOUT}>
        {label}
      </HeadingSmallText>
    </SmallButton>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap12: { gap: 12 },
  gap10: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 60,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 8,
  },
});
