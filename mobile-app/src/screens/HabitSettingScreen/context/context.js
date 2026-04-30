import { useState } from "react";
import {
  addActivity,
  clearSpecificActivityCompletionProgress,
  modifyActivity,
  moveActivity,
  userRoutineDataAction,
} from "@/actions/RoutineActions";
import { useHomeContext } from "@/screens/Home/context";
import { ACTIVITY_TYPE } from "@/constants/routines";
import { ALL } from "@/constants/activity";
import { useNavigation, useRoute } from "@react-navigation/native";
import { isEmpty } from "lodash";
import { i18n } from "@/localization";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { addInfoLog, addErrorLog } from "@/utils/FileLogger";
import { postHogCapture } from "@/utils/Posthog";
import { ACTIVITY_PRIORITY, POSTHOG_EVENT_NAMES } from "@/utils/Enums";

export const useHabitSetting = ({ activity, selectedActivity, isEnableTimer }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { routineData } = useHomeContext();

  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmEditHabit = async () => {
    const {
      id,
      name,
      activity_sequence_id,
      activity_type,
      habit_icon,
      duration_seconds,
      completion_requirements,
      days_of_week,
      video_urls,
      priority,
      allowed_mobile_apps,
    } = activity;

    const formattedName = (name || "").trim().replace(/[\r\n]+/g, " ");

    const newActivity = {
      id: id || uuidv4(),
      name: formattedName || i18n.t("habitSetting.defaultName"),
      ...(activity_sequence_id && { activity_sequence_id }),
      activity_type: activity_type || ACTIVITY_TYPE.MORNING,
      habit_icon: habit_icon || "",
      duration_seconds: Math.max(1, duration_seconds || 0),
      completion_requirements: isEnableTimer ? null : completion_requirements || i18n.t("habitSetting.noGoalSpecified"),
      days_of_week: isEmpty(days_of_week) ? [ALL] : days_of_week,
      video_urls: video_urls || [],
      priority: priority || ACTIVITY_PRIORITY.HIGH,
      allowed_mobile_apps: allowed_mobile_apps || [],
    };

    const { onSave } = route.params || {};

    if (onSave) {
      onSave(newActivity);
      navigation.goBack();
      return;
    }

    setIsLoading(true);

    if (duration_seconds !== selectedActivity?.duration_seconds) {
      dispatch(clearSpecificActivityCompletionProgress(selectedActivity?.id));
    }

    try {
      const isAddingActivity = !selectedActivity;

      if (isAddingActivity) {
        addInfoLog("user add habit", activity);
        await dispatch(addActivity(newActivity));
        postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_ADD_HABIT, { screen: "homescreen" });
      } else {
        const isMovingActivity = newActivity.activity_sequence_id !== selectedActivity.activity_sequence_id;

        if (isMovingActivity) {
          addInfoLog("user edit and move habit", activity);
          const { activity_type: prevActivityType, activity_sequence_id: prevActivitySequenceId } = selectedActivity;
          await dispatch(moveActivity(newActivity, { prevActivityType, prevActivitySequenceId }));
          postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_EDIT_MOVE_HABIT, { screen: "homescreen" });
        } else {
          addInfoLog("user edit habit", activity);
          await dispatch(modifyActivity(newActivity));
          postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_EDIT_HABIT, { screen: "homescreen" });
        }
      }

      const routineName = routineData.find(
        (routine) => routine.activity_sequence_id === newActivity.activity_sequence_id,
      )?.name;

      setTimeout(
        () =>
          Toast.show({
            type: "success",
            text1: i18n.t("common.Success"),
            text2: i18n.t("common.saveHabitSuccessfully", { habitName: formattedName, routineName }),
          }),
        100,
      );

      navigation.goBack();
      dispatch(userRoutineDataAction());
    } catch (error) {
      addErrorLog("Error saving habit settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleConfirmEditHabit };
};
