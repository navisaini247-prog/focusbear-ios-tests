import React, { memo, useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { MenuItem, SheetModal, ModalHeader, Button, ScalableIcon, HeadingSmallText } from "@/components";
import { useTranslation } from "react-i18next";
import { useFontScale } from "@/hooks/use-font-scale";
import { useHomeContext } from "@/screens/Home/context";
import { getSplitDateTime, formatDaysOfWeek, formatTimeRange } from "@/utils/TimeMethods";
import { useNavigation, useTheme } from "@react-navigation/native";
import { getRoutineTheme } from "@/screens/Home/hooks/use-routine-theme";
import { upperFirst } from "lodash";
import moment from "moment";
import { ACTIVITY_TYPE } from "@/constants/routines";
import { NAVIGATION } from "@/constants";
import { ALL } from "@/constants/activity";

export const formatRoutineSchedule = (routine, locale) => {
  const { type, start_time, end_time, days_of_week } = routine;
  const isCustomRoutine = type === ACTIVITY_TYPE.STANDALONE;
  const parts = [];

  if (start_time && end_time) {
    const startTime = getSplitDateTime(start_time);
    const endTime = getSplitDateTime(end_time);

    parts.push(isCustomRoutine ? formatTimeRange(startTime, endTime) : moment(startTime).format("LT").toLowerCase());
  }

  if (Array.isArray(days_of_week) && !days_of_week.includes(ALL) && days_of_week.length !== 7) {
    parts.push(formatDaysOfWeek(days_of_week, locale));
  }

  return upperFirst(parts.join(", "));
};

export const RoutineSelection = memo(function RoutineSelection({
  activityType,
  activitySequenceId,
  setActivityTypeAndSequenceId,
  ...props
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { routineData } = useHomeContext();
  const { isLargeFontScale } = useFontScale();
  const navigation = useNavigation();
  const locale = t("baseLanguage", { defaultValue: "en" });

  // Match custom routines by activity_sequence_id, and morning/evening routines by type
  const selectedRoutine = routineData.find((routine) =>
    routine.type === ACTIVITY_TYPE.STANDALONE
      ? routine.activity_sequence_id === activitySequenceId
      : routine.type === activityType,
  );

  const [isModalVisible, setIsModalVisible] = useState(false);

  const onPressAddRoutine = useCallback(() => {
    setIsModalVisible(false);
    navigation.navigate(NAVIGATION.EditCustomRoutine);
  }, [navigation]);

  return (
    <>
      <MenuItem
        type="dropDown"
        onPress={() => setIsModalVisible(true)}
        title={t("habitSetting.routine")}
        icon="menu"
        subtitle={selectedRoutine?.name}
        {...props}
      />

      <SheetModal
        isVisible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        HeaderComponent={<ModalHeader title={t("habitSetting.selectRoutine")} />}
      >
        <View style={[styles.gap8, styles.modalContent]}>
          {routineData.map((routine, index) => {
            const { icon, color } = getRoutineTheme(routine.type, colors);
            const isCustomRoutine = routine.type === ACTIVITY_TYPE.STANDALONE;

            return (
              <MenuItem
                key={`${routine.type}-${routine.activity_sequence_id}`}
                type="checkmark"
                title={routine.name}
                icon={icon}
                iconColor={color}
                description={formatRoutineSchedule(routine, locale)}
                isLargeFontScale={isLargeFontScale}
                onPress={() => {
                  setActivityTypeAndSequenceId(routine.type, routine.activity_sequence_id);
                  setIsModalVisible(false);
                }}
                isSelected={routine === selectedRoutine}
                testID={`test:id/routine-option-${isCustomRoutine ? `custom-${routine.name}` : routine.type}`}
              />
            );
          })}

          <AddRoutineButton onPress={onPressAddRoutine} />
        </View>
      </SheetModal>
    </>
  );
});

const AddRoutineButton = memo(function AddRoutineButton({ style, ...props }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Button
      subtle
      style={[styles.gap8, styles.addRoutineButton, { borderColor: colors.border }, style]}
      testID="test:id/add-custom-routine"
      {...props}
    >
      <ScalableIcon name="add" size={20} iconType="Ionicons" />
      <HeadingSmallText weight="300">{t("editRoutine.createNewRoutine")}</HeadingSmallText>
    </Button>
  );
});

const styles = StyleSheet.create({
  gap8: { gap: 8 },
  modalContent: {
    padding: 16,
    paddingTop: 8,
  },
  addRoutineButton: {
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "dashed",
  },
});
