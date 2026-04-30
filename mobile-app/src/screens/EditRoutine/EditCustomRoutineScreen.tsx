import React, { useState, useCallback, useRef, memo } from "react";
import { View, StyleSheet } from "react-native";
import {
  FloatingButton,
  Group,
  BigAppHeader,
  TextField,
  Checkmark,
  Button,
  ScalableIcon,
  HeadingSmallText,
  ButtonProps,
  AnimatedHeightView,
} from "@/components";
import { EditActivitiesFlatList } from "./components/EditActivitiesFlatList";
import { RoutineTriggerSelector } from "./components/TriggerSelector";
import { DayOfWeekSelector } from "../BlockingSchedule/components/DayOfWeekSelector";
import { ScheduleTimePickerGroup } from "../BlockingSchedule/components/ScheduleTimePickerGroup";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { isEmpty } from "lodash";
import { getSplitDateTime } from "@/utils/TimeMethods";
import { validateCustomRoutineTimes } from "@/utils/scheduleValidation";
import { v4 as uuidv4 } from "uuid";
import { addCustomRoutine, modifyCustomRoutine } from "@/actions/RoutineActions";
import { addErrorLog } from "@/utils/FileLogger";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { ACTIVITY_TYPE, ROUTINE_TRIGGER } from "@/constants/routines";
import { ALL } from "@/constants/activity";
import { NAVIGATION } from "@/constants";
import type { ScreenNavigationProp } from "@/navigation/AppNavigator";
import type { Activity, CustomRoutine, DayOfWeek, RoutineTrigger } from "@/types/Routine";

export const DEFAULT_ROUTINE: CustomRoutine = {
  id: "",
  name: "",
  trigger: ROUTINE_TRIGGER.ON_SCHEDULE,
  activity_sequence_id: "",
  standalone_activities: [],
  start_time: null,
  end_time: null,
  days_of_week: [ALL],
};

const getDefaultStartTime = () => `${new Date().getHours().toString().padStart(2, "0")}:00`;
const getDefaultEndTime = () => `${((new Date().getHours() + 1) % 24).toString().padStart(2, "0")}:00`;

const toHHMM = (d: Date) => `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

export const EditCustomRoutine = ({ navigation, route }: { navigation: ScreenNavigationProp; route: any }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const selectedRoutine = useRef(route.params?.routine).current;

  const [routine, setRoutine] = useState<CustomRoutine>(() => ({
    ...DEFAULT_ROUTINE,
    id: uuidv4(),
    start_time: getDefaultStartTime(),
    end_time: getDefaultEndTime(),
    ...selectedRoutine,
  }));

  const [isLoading, setIsLoading] = useState(false);

  const isNewRoutine = isEmpty(selectedRoutine);
  const timingError =
    routine.trigger === ROUTINE_TRIGGER.ON_SCHEDULE
      ? validateCustomRoutineTimes(t, routine.start_time, routine.end_time)
      : null;
  const saveDisabled = !routine.name.trim() || timingError != null;

  const setName = useCallback((name: string) => setRoutine((prev) => ({ ...prev, name })), []);
  const setTrigger = useCallback((trigger: RoutineTrigger) => setRoutine((prev) => ({ ...prev, trigger })), []);
  const setDaysOfWeek = useCallback((days_of_week: DayOfWeek[]) => {
    setRoutine((prev) => ({ ...prev, days_of_week }));
  }, []);
  const setStartTime = useCallback((start_time: string) => setRoutine((prev) => ({ ...prev, start_time })), []);
  const setEndTime = useCallback((end_time: string) => setRoutine((prev) => ({ ...prev, end_time })), []);

  const onPressSave = async () => {
    const { id, name, trigger, activity_sequence_id, standalone_activities, start_time, end_time, days_of_week } =
      routine;

    const formattedName = (name || "").trim().replace(/[\r\n]+/g, " ");

    const newRoutine = {
      id: id || uuidv4(),
      name: formattedName || t("editRoutine.customRoutineDefaultName"),
      trigger,
      activity_sequence_id: activity_sequence_id || uuidv4(),
      standalone_activities,
      start_time: trigger === ROUTINE_TRIGGER.ON_SCHEDULE ? start_time : null,
      end_time: trigger === ROUTINE_TRIGGER.ON_SCHEDULE ? end_time : null,
      ...(trigger === ROUTINE_TRIGGER.ON_SCHEDULE && { days_of_week }),
    };

    setIsLoading(true);

    try {
      if (isNewRoutine) {
        await dispatch(addCustomRoutine(newRoutine));
        postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_ADD_CUSTOM_ROUTINE);
      } else {
        await dispatch(modifyCustomRoutine(newRoutine));
        postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_EDIT_CUSTOM_ROUTINE);
      }

      navigation.goBack();
    } catch (error) {
      addErrorLog("Error saving routine", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPressAddActivity = useCallback(() => {
    navigation.navigate(NAVIGATION.HabitSetting, {
      activity: {
        activity_type: ACTIVITY_TYPE.STANDALONE,
        activity_sequence_id: routine.activity_sequence_id,
      },
      hideRoutineSelection: true,
      onSave: (activity: Activity) => {
        setRoutine((prev) => ({ ...prev, standalone_activities: [...prev.standalone_activities, activity] }));
        postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_ADD_HABIT, { screen: "edit-custom-routine" });
      },
    } as any);
  }, [navigation, routine.activity_sequence_id]);

  const onPressEditActivity = useCallback(
    (activity: Activity) => {
      navigation.navigate(NAVIGATION.HabitSetting, {
        activity,
        hideRoutineSelection: true,
        onSave: (updatedActivity: Activity) => {
          setRoutine((prev) => ({
            ...prev,
            standalone_activities: prev.standalone_activities.map((_activity) =>
              _activity.id === activity.id ? updatedActivity : _activity,
            ),
          }));
          postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_EDIT_HABIT, { screen: "edit-custom-routine" });
        },
      } as any);
    },
    [navigation],
  );

  const onPressDeleteActivity = useCallback((activity: Activity) => {
    setRoutine((prev) => ({
      ...prev,
      standalone_activities: prev.standalone_activities.filter((a) => a.id !== activity.id),
    }));
    postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_DELETE_HABIT, { screen: "edit-custom-routine" });
  }, []);

  const reorderActivity = useCallback((fromIndex: number, toIndex: number) => {
    setRoutine((prev) => {
      const newActivities = [...prev.standalone_activities];
      const item = newActivities[fromIndex];

      newActivities.splice(fromIndex, 1);
      newActivities.splice(toIndex, 0, item);
      return { ...prev, standalone_activities: newActivities };
    });
    postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_REORDER_HABIT, { screen: "edit-custom-routine" });
  }, []);

  return (
    <View style={styles.flex}>
      <BigAppHeader title="" />
      <EditActivitiesFlatList
        data={routine.standalone_activities}
        contentContainerStyle={styles.container}
        onPressEdit={onPressEditActivity}
        onPressDelete={onPressDeleteActivity}
        onReorder={reorderActivity}
        renderScrollComponent={(props) => <KeyboardAwareScrollView bottomOffset={100} {...props} />}
        ListHeaderComponent={
          <AnimatedHeightView>
            <View style={[styles.gap24, styles.settingsContainer]}>
              <TextField
                inputStyle={styles.nameInput}
                value={routine.name}
                onChangeText={setName}
                placeholder={
                  isNewRoutine ? t("editRoutine.newRoutinePlaceholder") : t("editRoutine.routineNamePlaceholder")
                }
                autoFocus={isNewRoutine}
              />

              <View style={styles.gap12}>
                <Group>
                  <RoutineTriggerSelector trigger={routine.trigger} setTrigger={setTrigger} />

                  {routine.trigger === ROUTINE_TRIGGER.ON_SCHEDULE && (
                    <ScheduleTimePickerGroup
                      startTime={getSplitDateTime(routine.start_time || getDefaultStartTime())}
                      setStartTime={(time) => setStartTime(toHHMM(time))}
                      endTime={getSplitDateTime(routine.end_time || getDefaultEndTime())}
                      setEndTime={(time) => setEndTime(toHHMM(time))}
                      errorMessage={timingError}
                    />
                  )}

                  {routine.trigger === ROUTINE_TRIGGER.ON_SCHEDULE && (
                    <DayOfWeekSelector selectedDays={routine.days_of_week} setSelectedDays={setDaysOfWeek} />
                  )}
                </Group>
              </View>
            </View>
          </AnimatedHeightView>
        }
        ListFooterComponent={<AddActivityButton onPress={onPressAddActivity} />}
      />

      {/* Save button */}
      <FloatingButton
        primary
        title={t("common.save")}
        renderLeftIcon={<Checkmark value={true} color={saveDisabled ? colors.text : colors.white} />}
        onPress={onPressSave}
        isLoading={isLoading}
        disabled={saveDisabled}
        testID="test:id/confirm-edit-routine"
      />
    </View>
  );
};

export const AddActivityButton = memo(function AddActivityButton({ style, ...props }: ButtonProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Button
      subtle
      style={[styles.addActivityButton, { borderColor: colors.border }, style]}
      testID="test:id/add-habit"
      {...props}
    >
      <ScalableIcon name="add" size={20} color={colors.text} iconType="Ionicons" />
      <HeadingSmallText weight="300">{t("home.addHabit")}</HeadingSmallText>
    </Button>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap12: { gap: 12 },
  gap24: { gap: 24 },
  container: {
    padding: 16,
    paddingBottom: 120,
  },
  settingsContainer: {
    paddingBottom: 24,
  },
  nameInput: {
    fontSize: 18,
    minHeight: 48,
    textAlignVertical: "center",
  },
  addActivityButton: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "dashed",
    marginTop: 12,
  },
});
