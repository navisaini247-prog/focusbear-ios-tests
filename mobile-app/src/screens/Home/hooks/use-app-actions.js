import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";
import { NAVIGATION } from "@/constants";
import { addTask, getCurrentActivityProps, setFocusModeFinishTime } from "@/actions/UserActions";
import { userRoutineDataAction } from "@/actions/RoutineActions";
import { onActivityStart } from "@/actions/ActivityActions";
import {
  changeFocusModeState,
  setFocusDuration,
  setFocusModeNotes,
  setIsFocusSuperStrictMode,
  startFocusMode,
} from "@/actions/FocusModeActions";
import { useSelector } from "@/reducers";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { currentFocusModeFinishTimeSelector } from "@/selectors/UserSelectors";
import { routineProcessSelector } from "@/selectors/RoutineSelectors";
import { isNewUserSelector } from "@/selectors/GlobalSelectors";
import { useRoutineData } from "@/hooks/use-routine-data";
import { useNextHabit } from "@/hooks/use-next-habit";

const APP_ACTIONS = {
  ADD_TASK: "add-task",
  START_FOCUS_SESSION: "start-focus-session",
  START_ROUTINE: "start-routine",
};

const EMPTY_ACTION_PARAMS = {
  action: undefined,
  duration: undefined,
  intention: undefined,
  name: undefined,
};

export const useAppActions = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const handledActionKeyRef = useRef(null);
  const [routineDataReady, setRoutineDataReady] = useState(false);
  const [addTaskAppActionRequest, setAddTaskAppActionRequest] = useState(null);

  const params = route.params || {};
  const { action } = params;
  const taskName = String(params.name || "");
  const focusIntention = String(params.intention || "");
  const parsedFocusDuration = Number(params.duration);
  const focusDurationMinutes =
    Number.isFinite(parsedFocusDuration) && parsedFocusDuration > 0 ? parsedFocusDuration : 25;

  const { focusModesList } = useSelector((state) => state.focusMode);
  const currentFocusModeFinishTime = useSelector(currentFocusModeFinishTimeSelector);
  const routineProcess = useSelector(routineProcessSelector, true);
  const shouldSkipRoutineForNewUserOnFirstDay = useSelector(isNewUserSelector);

  const routineData = useRoutineData();
  const routineDataForNextActivity = shouldSkipRoutineForNewUserOnFirstDay ? [] : routineData;
  const { nextActivity } = useNextHabit(routineDataForNextActivity, routineProcess);

  const isFocusSessionActive = currentFocusModeFinishTime
    ? new Date(currentFocusModeFinishTime) > new Date()
    : false;

  const actionKey = action
    ? JSON.stringify({
        action,
        duration: params.duration,
        intention: params.intention,
        name: params.name,
      })
    : null;

  const clearActionParams = useCallback(() => {
    navigation.setParams(EMPTY_ACTION_PARAMS);
  }, [navigation]);

  const handleAddTaskAction = useCallback(async () => {
    const trimmedTaskName = taskName.trim();
    const shouldAutoAddTask = trimmedTaskName.length > 0;

    if (shouldAutoAddTask) {
      try {
        await dispatch(addTask({ title: trimmedTaskName }));

        Toast.show({
          type: "success",
          text1: t("toDos.taskAdded"),
          text2: trimmedTaskName,
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: t("toDos.failedToAddTask"),
        });
      }
    }

    postHogCapture(POSTHOG_EVENT_NAMES.TODOS_ADD_TASK, {
      source: "app_action",
      has_name: shouldAutoAddTask,
    });

    setAddTaskAppActionRequest({
      addNewTask: true,
    });

    clearActionParams();
  }, [clearActionParams, dispatch, t, taskName]);

  const handleStartFocusSessionAction = useCallback(async () => {
    if (isFocusSessionActive) {
      postHogCapture(POSTHOG_EVENT_NAMES.START_FOCUS_MODE_MANUALLY, {
        source: "app_action",
        focus_session_already_active: true,
      });
      clearActionParams();
      navigation.navigate(NAVIGATION.Focus);
      return;
    }

    try {
      const durationMs = focusDurationMinutes * 60 * 1000;
      const focusTime = new Date(durationMs);
      const finishTimeISO = new Date(Date.now() + durationMs).toISOString();
      const startTimeISO = new Date().toISOString();
      const defaultFocusMode = focusModesList.find((focusMode) => focusMode.metadata && focusMode.metadata.isDefault === true);

      dispatch(setIsFocusSuperStrictMode(false));
      dispatch(
        setFocusModeNotes({
          intention: focusIntention,
          thoughts: "",
        }),
      );

      if (defaultFocusMode?.id) {
        await dispatch(startFocusMode(defaultFocusMode.id, startTimeISO, finishTimeISO, focusIntention));
      }

      dispatch(changeFocusModeState(true));
      dispatch(setFocusDuration({ hours: focusTime.getUTCHours(), minutes: focusTime.getUTCMinutes() }));
      dispatch(setFocusModeFinishTime(finishTimeISO));

      postHogCapture(POSTHOG_EVENT_NAMES.START_FOCUS_MODE_MANUALLY, {
        source: "app_action",
        duration_minutes: focusDurationMinutes,
      });
    } catch (error) {
      console.error("Error starting focus session:", error);
    }

    clearActionParams();
    navigation.navigate(NAVIGATION.Focus);
  }, [
    clearActionParams,
    dispatch,
    focusDurationMinutes,
    focusIntention,
    focusModesList,
    isFocusSessionActive,
    navigation,
  ]);

  const handleStartRoutineAction = useCallback(async () => {
    setRoutineDataReady(false);

    try {
      await Promise.all([dispatch(userRoutineDataAction()), dispatch(getCurrentActivityProps())]);
    } catch (error) {
      console.error("Error fetching routine data:", error);
    }

    setRoutineDataReady(true);
  }, [dispatch]);

  useEffect(() => {
    if (!action) {
      handledActionKeyRef.current = null;
      setRoutineDataReady(false);
      return;
    }

    if (!actionKey || handledActionKeyRef.current === actionKey) {
      return;
    }

    handledActionKeyRef.current = actionKey;

    if (action === APP_ACTIONS.ADD_TASK) {
      handleAddTaskAction();
      return;
    }

    if (action === APP_ACTIONS.START_FOCUS_SESSION) {
      handleStartFocusSessionAction();
      return;
    }

    if (action === APP_ACTIONS.START_ROUTINE) {
      handleStartRoutineAction();
      return;
    }

    clearActionParams();
  }, [
    action,
    actionKey,
    clearActionParams,
    handleAddTaskAction,
    handleStartFocusSessionAction,
    handleStartRoutineAction,
  ]);

  useEffect(() => {
    if (action !== APP_ACTIONS.START_ROUTINE || !routineDataReady) {
      return;
    }

    clearActionParams();
    setRoutineDataReady(false);

    if (nextActivity) {
      navigation.navigate(NAVIGATION.RoutineDetail, { item: nextActivity });
      onActivityStart(nextActivity);
    }
  }, [
    action,
    clearActionParams,
    navigation,
    nextActivity,
    routineDataReady,
  ]);

  return addTaskAppActionRequest;
};
