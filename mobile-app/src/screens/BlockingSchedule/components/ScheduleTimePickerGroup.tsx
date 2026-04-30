import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { Card, CardProps, Separator, HeadingSmallText, BodySmallText, Modal, ScalableIcon } from "@/components";
import { PressableWithFeedback } from "@/components";
import { ScheduleTimePickerCard } from "./ScheduleTimePickerCard";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import moment from "moment";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { clampFontScale } from "@/utils/FontScaleUtils";

const isIOS = Platform.OS === "ios";
const FONT_SCALE_STACK_THRESHOLD = 1.4;

interface Props extends CardProps {
  startTime: Date;
  endTime: Date;
  setStartTime: (time: Date) => void;
  setEndTime: (time: Date) => void;
  errorMessage?: string;
}

export const ScheduleTimePickerGroup = ({
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  errorMessage,
  ...props
}: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const useStackedLayout = clampFontScale(fontScale) >= FONT_SCALE_STACK_THRESHOLD;

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTimeType, setSelectedTimeType] = useState<"start" | "end" | null>(null);

  const onOptionPress = (type: "start" | "end") => {
    if (isIOS) {
      setSelectedTimeType(type);
      setModalVisible(true);
    } else {
      DateTimePickerAndroid.open({
        mode: "time",
        value: type === "start" ? startTime : endTime,
        onChange: (event, time) => event.type === "set" && (type === "start" ? setStartTime(time) : setEndTime(time)),
      });
    }
  };

  // Ensure end time is always at least 15 minutes after start time
  useEffect(() => {
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const spansMidnight = endMinutes < startMinutes;
    const minutesInbetween = endMinutes - startMinutes + (spansMidnight ? 24 * 60 : 0);

    if (minutesInbetween < 15) setEndTime(new Date(startTime.getTime() + 15 * 60 * 1000));
  }, [startTime, endTime, setEndTime]);

  return (
    <>
      <Card noPadding {...props}>
        <PressableWithFeedback
          onPress={() => onOptionPress("start")}
          style={[styles.button, useStackedLayout ? styles.stackedButton : styles.row, styles.gap12, styles.wrapRow]}
          testID="test:id/schedule-start-time"
        >
          <View style={[styles.row, styles.gap12, styles.leftGroup, useStackedLayout && styles.stackedLeftGroup]}>
            <ScalableIcon name="time" size={20} color={colors.subText} />
            <HeadingSmallText style={styles.label}>{t("blockingSchedule.startTime")}</HeadingSmallText>
          </View>

          <View style={[styles.row, styles.gap8, styles.rightGroup, useStackedLayout && styles.stackedRightGroup]}>
            <BodySmallText color={colors.subText}>{moment(startTime).format("LT")}</BodySmallText>
            <ScalableIcon name="chevron-forward" size={20} color={colors.text} />
          </View>
        </PressableWithFeedback>

        <Separator style={[styles.separator, useStackedLayout && styles.separatorStacked]} />

        <PressableWithFeedback
          onPress={() => onOptionPress("end")}
          style={[styles.button, useStackedLayout ? styles.stackedButton : styles.row, styles.gap12, styles.wrapRow]}
          testID="test:id/schedule-end-time"
        >
          <View style={[styles.row, styles.gap12, styles.leftGroup, useStackedLayout && styles.stackedLeftGroup]}>
            <ScalableIcon name="square" size={20} color={colors.transparent} />
            <HeadingSmallText style={styles.label}>{t("blockingSchedule.endTime")}</HeadingSmallText>
          </View>

          <View style={[styles.row, styles.gap8, styles.rightGroup, useStackedLayout && styles.stackedRightGroup]}>
            <BodySmallText color={colors.subText}>{moment(endTime).format("LT")}</BodySmallText>
            <ScalableIcon name="chevron-forward" size={20} color={colors.text} />
          </View>
        </PressableWithFeedback>

        {errorMessage && (
          <View style={[styles.row, styles.gap12, styles.leftGroup]}>
            <ScalableIcon name="square" size={20} color={colors.transparent} />
            <BodySmallText color={colors.danger} style={styles.errorText}>
              {errorMessage}
            </BodySmallText>
          </View>
        )}
      </Card>

      <Modal isVisible={isModalVisible} onCancel={() => setModalVisible(false)}>
        <ScheduleTimePickerCard
          title={selectedTimeType === "start" ? t("blockingSchedule.adjustStart") : t("blockingSchedule.adjustEnd")}
          initialValue={selectedTimeType === "start" ? startTime : endTime}
          onSubmit={(time: Date) => {
            selectedTimeType === "start" ? setStartTime(time) : setEndTime(time);
            setModalVisible(false);
          }}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  wrapRow: {
    flexWrap: "wrap",
  },
  stackedButton: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  stackedLeftGroup: {
    flexGrow: 0,
    minWidth: undefined,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    flexShrink: 0,
  },
  stackedRightGroup: {
    marginLeft: 0,
    alignSelf: "flex-start",
  },
  label: {
    flexShrink: 1,
    minWidth: 0,
  },
  button: {
    padding: 12,
    minHeight: 48,
  },
  separator: {
    marginLeft: 48,
  },
  separatorStacked: {
    marginLeft: 0,
  },
  errorText: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
});
