import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { FloatingButton, BigAppHeader, Checkmark, HeadingXLargeText } from "@/components";
import { EditActivitiesFlatList } from "./components/EditActivitiesFlatList";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { AddActivityButton } from "./EditCustomRoutineScreen";
import { TimePickerMenuItem } from "./components/TimePickerMenuItem";
import { useRoutineTheme } from "../Home/hooks/use-routine-theme";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { fullRoutineDataSelector, cutOffTimeSelector } from "@/selectors/RoutineSelectors";
import { putUserSettings } from "@/actions/UserActions";
import { getSplitDateTime } from "@/utils/TimeMethods";
import { addErrorLog } from "@/utils/FileLogger";
import { validateRoutineSchedule } from "@/utils/scheduleValidation";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { ACTIVITY_TYPE } from "@/constants/routines";
import { NAVIGATION } from "@/constants";
import type { ScreenNavigationProp } from "@/navigation/AppNavigator";
import type { ActivityType, Activity, RoutineData } from "@/types/Routine";

const toHHMM = (d: Date) => `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

export const EditMorningEveningRoutine = ({ navigation, route }: { navigation: ScreenNavigationProp; route: any }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const fullRoutineData: RoutineData = useSelector(fullRoutineDataSelector);
  const cutoffTime = useSelector(cutOffTimeSelector);

  const { startup_time, shutdown_time, morning_activities, evening_activities } = fullRoutineData;

  const type = useRef<ActivityType>(route.params?.type).current;
  const activitySequenceId = useRef<string>(route.params?.activitySequenceId).current;
  const isMorning = type === ACTIVITY_TYPE.MORNING;
  const { icon, color } = useRoutineTheme(type);

  const [activities, setActivities] = useState<Activity[]>(isMorning ? morning_activities : evening_activities);
  const [startTime, setStartTime] = useState<string>(isMorning ? startup_time : shutdown_time);

  const [isLoading, setIsLoading] = useState(false);

  const validation = validateRoutineSchedule(
    t,
    isMorning ? startTime : startup_time,
    isMorning ? shutdown_time : startTime,
    cutoffTime,
  );

  // Startup/shutdown equality error takes precedence
  const timeError = (isMorning ? validation.startup : validation.shutdown) ?? validation.cutoff;
  const saveDisabled = timeError != null;

  const onPressSave = async () => {
    setIsLoading(true);

    const updatedRoutineData: RoutineData = {
      ...fullRoutineData,
      [isMorning ? "morning_activities" : "evening_activities"]: activities,
      [isMorning ? "startup_time" : "shutdown_time"]: startTime,
    };

    try {
      await dispatch(putUserSettings(updatedRoutineData));
      postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_EDIT_MORNING_EVENING_ROUTINE);

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
        activity_type: type,
        activity_sequence_id: activitySequenceId,
      },
      hideRoutineSelection: true,
      onSave: (activity: Activity) => {
        setActivities((prev) => [...prev, activity]);
        postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_ADD_HABIT, { screen: "edit-morning-evening-routine" });
      },
    } as any);
  }, [navigation, activitySequenceId, type]);

  const onPressEditActivity = useCallback(
    (activity: Activity) => {
      navigation.navigate(NAVIGATION.HabitSetting, {
        activity,
        hideRoutineSelection: true,
        onSave: (updatedActivity: Activity) => {
          setActivities((prev) =>
            prev.map((_activity) => (_activity.id === activity.id ? updatedActivity : _activity)),
          );
          postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_EDIT_HABIT, { screen: "edit-morning-evening-routine" });
        },
      } as any);
    },
    [navigation],
  );

  const onPressDeleteActivity = useCallback((activity: Activity) => {
    setActivities((prev) => prev.filter((a) => a.id !== activity.id));
    postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_DELETE_HABIT, { screen: "edit-morning-evening-routine" });
  }, []);

  const reorderActivity = useCallback((fromIndex: number, toIndex: number) => {
    setActivities((prev) => {
      const item = prev[fromIndex];
      const newActivities = [...prev];

      newActivities.splice(fromIndex, 1);
      newActivities.splice(toIndex, 0, item);
      return newActivities;
    });
    postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_REORDER_HABIT, { screen: "edit-morning-evening-routine" });
  }, []);

  return (
    <View style={styles.flex}>
      <BigAppHeader title="" />
      <EditActivitiesFlatList
        data={activities}
        contentContainerStyle={styles.container}
        onPressEdit={onPressEditActivity}
        onPressDelete={onPressDeleteActivity}
        onReorder={reorderActivity}
        renderScrollComponent={(props) => <KeyboardAwareScrollView bottomOffset={100} {...props} />}
        ListHeaderComponent={
          <View style={[styles.gap24, styles.settingsContainer]}>
            <HeadingXLargeText weight="700">
              {isMorning ? t("overview.morningRoutine") : t("overview.eveningRoutine")}
            </HeadingXLargeText>

            <TimePickerMenuItem
              big
              time={getSplitDateTime(startTime)}
              setTime={(time) => setStartTime(toHHMM(time))}
              icon={icon}
              iconColor={color}
              title={t("editRoutine.time")}
              modalTitle={
                isMorning ? t("editRoutine.morningRoutineStartTime") : t("editRoutine.eveningRoutineStartTime")
              }
              errorMessage={timeError}
              testID={"test:id/routine-start-time"}
            />
          </View>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap24: { gap: 24 },
  container: {
    padding: 16,
    paddingBottom: 120,
  },
  settingsContainer: {
    paddingBottom: 24,
  },
});
