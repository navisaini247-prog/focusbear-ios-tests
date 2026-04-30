import { Alert } from "react-native";
import { i18n } from "@/localization";
import { store } from "@/store";
import { APIMethod } from "@/utils/ApiMethod";
import { APIURLS } from "@/utils/ApiUrls";
import { POSTHOG_EVENT_NAMES, WATCH_COMMAND } from "@/utils/Enums";
import { HTTP_STATUS_CONFLICT } from "@/constants";
import { ACTIVITY_TYPE, ROUTINE_STATUS } from "@/constants/routines";
import { addErrorLog, addInfoLog, logAPIError } from "@/utils/FileLogger";
import { clearSpecificActivityCompletionProgress } from "@/actions/RoutineActions";
import { logSentryError, postHogCapture } from "@/utils/Posthog";

import moment from "moment";
import {
  getCurrentActivityProps,
  setHasDoneDailyEveningSession,
  setHasDoneDailyMorningSession,
  setSpecificRoutineProgress,
  updateCurrentSequenceSkippedActivities,
} from "./UserActions";
import { platform } from "@/constants/passwordRules";
import { getAppVersion } from "@/utils/GlobalMethods";
import { sendDataToWatchApp } from "@/utils/NativeModuleMethods";
import {
  hasDoneDailyEveningSessionSelector,
  hasDoneDailyMorningSessionSelector,
  currentSkippedActivitiesSelector,
  todayRoutineProgressSelector,
} from "@/selectors/UserSelectors";
import { cutOffTimeSelector, fullRoutineDataSelector, startUpTimeSelector } from "@/selectors/RoutineSelectors";
import { checkIsIOS } from "@/utils/PlatformMethods";
import {
  calculateIsRoutineCompleted,
  getActivitiesByActivitySequenceId,
  getRoutineProgressByActivitySequenceId,
} from "@/utils/ActivityRoutineMethods";

export const TYPES = {
  CLEAR_STORE: "CLEAR_STORE",
  FOREGROUND_SCHEDULE_METHOD: "FOREGROUND_SCHEDULE_METHOD",
  SET_POSTPONE_FLOW_FROM_DISTRACTION_ALERT_BOOL: "SET_POSTPONE_FLOW_FROM_DISTRACTION_ALERT_BOOL",
  SAVE_UNSYNCED_ACTIVITIES: "SAVE_UNSYNCED_ACTIVITIES",
  SET_START_BLOCKING_APPS: "SET_START_BLOCKING_APPS",
  SET_STOP_BLOCKING_APPS: "SET_STOP_BLOCKING_APPS",
  SET_ENABLE_DND_DURING_HABIT: "SET_ENABLE_DND_DURING_HABIT",
  ADD_EVENT_TO_QUEUE: "ADD_EVENT_TO_QUEUE",
  CLEAR_EVENT_QUEUE: "CLEAR_EVENT_QUEUE",
  SET_IS_SENDING_EVENTS: "SET_IS_SENDING_EVENTS",
  INCREMENT_MORNING_STREAK: "INCREMENT_MORNING_STREAK",
  INCREMENT_EVENING_STREAK: "INCREMENT_EVENING_STREAK",
  INCREMENT_FOCUS_STREAK: "INCREMENT_FOCUS_STREAK",
};

export const setEnableDndDuringHabit = (data) => ({
  type: TYPES.SET_ENABLE_DND_DURING_HABIT,
  payload: { data },
});

export const addEventToQueue = (event) => ({
  type: TYPES.ADD_EVENT_TO_QUEUE,
  payload: { data: event },
});

export const clearEventQueue = () => ({
  type: TYPES.CLEAR_EVENT_QUEUE,
});

export const setIsSendingEvents = (isSending) => ({
  type: TYPES.SET_IS_SENDING_EVENTS,
  payload: { data: isSending },
});

export const setStartBlocking = (data) => ({
  type: TYPES.SET_START_BLOCKING_APPS,
  payload: { data },
});

export const setStopBlocking = (data) => ({
  type: TYPES.SET_STOP_BLOCKING_APPS,
  payload: { data },
});

export const saveUnsyncedActivities = (data) => ({
  type: TYPES.SAVE_UNSYNCED_ACTIVITIES,
  payload: { data },
});

export const setPostPoneFlowFromDistractionAlertBool_Method = (data) => ({
  type: TYPES.SET_POSTPONE_FLOW_FROM_DISTRACTION_ALERT_BOOL,
  payload: { data },
});

export const onActivityStart = (activity) => {
  const { activity_type } = activity;

  if (activity_type === ACTIVITY_TYPE.MORNING) {
    postHogCapture(POSTHOG_EVENT_NAMES.START_MORNING_ROUTINE);
  } else if (activity_type === ACTIVITY_TYPE.EVENING) {
    postHogCapture(POSTHOG_EVENT_NAMES.START_EVENING_ROUTINE);
  } else if (activity_type === ACTIVITY_TYPE.STANDALONE) {
    postHogCapture(POSTHOG_EVENT_NAMES.START_CUSTOM_ROUTINE);
  }

  if (checkIsIOS()) {
    sendDataToWatchApp({ text: activity });
  } else {
    sendDataToWatchApp({ text: activity, DATA_TYPE: WATCH_COMMAND.SET_ACTIVITY_OUT_OF_ORDER });
  }
};

export const pusherActivityCompleted = (taskData) => async (dispatch, getState) => {
  addInfoLog(`Pusher Event triggered --> Activity Completed ->`);

  const activityId = checkIsIOS() ? taskData.activity_id : taskData.completed_activity_id;
  const activitySequenceId = taskData.activity_sequence_id;
  const leaderDeviceId = taskData.leader_device_id;

  const state = getState();
  const { deviceData, current_activity_sequence } = state.user;
  const fullRoutineData = fullRoutineDataSelector(state);

  if (deviceData?.id === leaderDeviceId) {
    return;
  }

  if (current_activity_sequence?.id !== activitySequenceId) {
    return;
  }

  const activities = getActivitiesByActivitySequenceId(activitySequenceId, fullRoutineData);
  const activity = activities?.find((_activity) => _activity.id === activityId);

  if (!activity) {
    return;
  }

  dispatch(updateCompletedActivities(activity));
};

export const updateCompletedActivities = (activity) => async (dispatch, getState) => {
  const state = getState();
  const cutOffTime = cutOffTimeSelector(state);
  const startUpTime = startUpTimeSelector(state);
  const skippedActivities = currentSkippedActivitiesSelector(state);
  const fullRoutineData = fullRoutineDataSelector(state);
  const todayRoutineProgress = todayRoutineProgressSelector(state);

  const routineProgress = getRoutineProgressByActivitySequenceId(activity.activity_sequence_id, todayRoutineProgress);
  const activities = getActivitiesByActivitySequenceId(activity.activity_sequence_id, fullRoutineData);
  const completedActivities = routineProgress?.completed_habit_ids || [];

  addInfoLog(`Activity "${activity.name}" completed, activity type is ${activity.activity_type}`);
  addInfoLog("prev routine progress", JSON.stringify(routineProgress));

  if (!completedActivities.includes(activity.id)) {
    const updatedCompletedActivities = [...completedActivities, activity.id];

    const isRoutineCompleted = calculateIsRoutineCompleted({
      activities,
      completedActivities: updatedCompletedActivities,
      skippedActivities,
      startUpTime,
      cutOffTime,
    });

    const updatedRoutineProgress = {
      ...routineProgress,
      sequence_id: activity.activity_sequence_id,
      status: isRoutineCompleted ? ROUTINE_STATUS.COMPLETED : ROUTINE_STATUS.IN_PROGRESS,
      completed_habit_ids: updatedCompletedActivities,
    };

    addInfoLog("updated routine progress", JSON.stringify(updatedRoutineProgress));

    dispatch(setSpecificRoutineProgress(activity.activity_type, updatedRoutineProgress));

    if (isRoutineCompleted) {
      addInfoLog(`All activities completed`);

      if (activity.activity_type === ACTIVITY_TYPE.EVENING) {
        postHogCapture(POSTHOG_EVENT_NAMES.COMPLETE_EVENING_ROUTINE);
      } else if (activity.activity_type === ACTIVITY_TYPE.MORNING) {
        postHogCapture(POSTHOG_EVENT_NAMES.COMPLETE_MORNING_ROUTINE);
      } else if (activity.activity_type === ACTIVITY_TYPE.STANDALONE) {
        postHogCapture(POSTHOG_EVENT_NAMES.COMPLETE_CUSTOM_ROUTINE);
      }
    } else {
      addInfoLog(`Not all activities completed`);
    }
  }
};

export const updateCurrentSequenceSkippedActivitiesAction = (id) => async (dispatch, getState) => {
  const state = getState();
  const currentSequenceSkippedActivities = state.user.current_sequence_skipped_activities || [];

  addInfoLog(`Activity ${id} was skipped`);

  if (!currentSequenceSkippedActivities.includes(id)) {
    const newCurrentSequenceSkippedActivities = [...currentSequenceSkippedActivities, id];
    dispatch(updateCurrentSequenceSkippedActivities(newCurrentSequenceSkippedActivities));
  }
};

export const onPostPoneFlowFromDistractionAlert = (postPoneFlowFromDistractionAlert) => async (dispatch) => {
  dispatch(setPostPoneFlowFromDistractionAlertBool_Method(postPoneFlowFromDistractionAlert));
};

export const completeActivityAPI = (item, inputValue, noteLogged) => async (dispatch, getState) => {
  const { user } = getState();

  const hasDoneMorning = hasDoneDailyMorningSessionSelector(getState());
  const hasDoneEvening = hasDoneDailyEveningSessionSelector(getState());

  const finishTime = moment().subtract(5, "second").utc().format();
  const startTime = moment(finishTime).subtract(item?.duration_seconds, "second").utc().format();
  const device_ID = user?.deviceData?.id;
  const body = {
    activity_id: item?.activity_id ? item?.activity_id : item?.id,
    duration_logged: item?.duration_seconds,
    note_logged: noteLogged,
    device_id: device_ID,
    activity_sequence_id: item?.activity_sequence_id,
    start_time: startTime,
    finish_time: finishTime,
    log_quantity_answers: inputValue,
  };
  if (item?.activity_id) {
    body.choice_id = item?.id;
  }
  APIMethod({
    endpoint: APIURLS.completedActivity,
    body,
  })
    .then((resolve) => {
      const { current_sequence_completed_activities } = getState().user;
      const completedHabitsCount = (current_sequence_completed_activities?.length || 0) + 1;

      addInfoLog("completed activity response ==>");
      addInfoLog(`Activity Completed, ActivityId: ${resolve?.data?.completed_activity_log?.activity_id}`);

      if (item.activity_type === ACTIVITY_TYPE.EVENING) {
        postHogCapture(POSTHOG_EVENT_NAMES.COMPLETE_EVENING_ROUTINE_ACTIVITY);
      } else if (item.activity_type === ACTIVITY_TYPE.MORNING) {
        postHogCapture(POSTHOG_EVENT_NAMES.COMPLETE_MORNING_ROUTINE_ACTIVITY);
      } else if (item.activity_type === ACTIVITY_TYPE.STANDALONE) {
        postHogCapture(POSTHOG_EVENT_NAMES.COMPLETE_CUSTOM_ROUTINE_ACTIVITY);
      }

      if (completedHabitsCount >= 1) {
        if (item.activity_type === ACTIVITY_TYPE.EVENING && !hasDoneEvening) {
          dispatch(setHasDoneDailyEveningSession());
          dispatch({ type: TYPES.INCREMENT_EVENING_STREAK });
        } else if (item.activity_type === ACTIVITY_TYPE.MORNING && !hasDoneMorning) {
          dispatch(setHasDoneDailyMorningSession());
          dispatch({ type: TYPES.INCREMENT_MORNING_STREAK });
        }
      }
    })
    .catch((error) => {
      logAPIError("completed activity error ==>", error);
      const { unsyncedActivities } = getState().activity;

      try {
        // syncing failed , save activity data to sync it later
        let mapUnsyncedActivities;
        if (unsyncedActivities && unsyncedActivities.length > 10) {
          mapUnsyncedActivities = new Map(Object.entries(JSON.parse(unsyncedActivities)));
        } else {
          mapUnsyncedActivities = new Map();
        }

        const currentDate = new Date().toISOString().slice(0, 10);

        if (mapUnsyncedActivities.has(currentDate)) {
          const unsyncedActivities = mapUnsyncedActivities.get(currentDate);
          unsyncedActivities.push(body);
        } else {
          const unsyncedActivities = [];
          unsyncedActivities.push(body);
          mapUnsyncedActivities.set(currentDate, unsyncedActivities);
        }
        const jsonFromMap = JSON.stringify(Object.fromEntries(mapUnsyncedActivities));
        dispatch(saveUnsyncedActivities(jsonFromMap));
      } catch (e) {
        logSentryError(e);
        addErrorLog("Error while syncing completed activity", e);
      }
    });
};

export const skipActivity = (item, didAlready) => async (dispatch, getState) => {
  const { user } = getState();
  const deviceId = user?.deviceData?.id;

  const endpoint = didAlready ? APIURLS.completedActivity : APIURLS.skipHabitActivity;
  const body = {
    activity_id: item.activity_id || item.id,
    activity_sequence_id: item.activity_sequence_id,
    device_id: deviceId,
    metadata: didAlready ? { skipped_did_complete: true } : { skipped_did_not_complete: true },
    ...(didAlready && {
      start_time: moment().utc().format(),
      finish_time: moment().add(item.duration_seconds, "seconds").utc().format(),
      duration_logged: item.duration_seconds,
    }),
  };

  const eventName = didAlready
    ? POSTHOG_EVENT_NAMES.SKIPPED_HABIT_ALREADY_DID_IT
    : POSTHOG_EVENT_NAMES.SKIPPED_HABIT_CANNOT_DO_TODAY;
  postHogCapture(eventName);

  dispatch(clearSpecificActivityCompletionProgress(item.id));
  dispatch(updateCompletedActivities(item));

  if (!didAlready) {
    dispatch(updateCurrentSequenceSkippedActivitiesAction(item.id));
  }
  sendDataToWatchApp({ text: didAlready ? i18n.t("common.finished") : i18n.t("common.skip") });

  await APIMethod({ endpoint, method: "POST", body })
    .then((response) => {
      addInfoLog(`${didAlready ? "Completed" : "Skipped"} activity response ==>`);
      addInfoLog(`ActivityId: ${response?.data?.completed_activity_log?.activity_id}`);
    })
    .catch((error) => {
      logAPIError(`Complete skip Error: ${didAlready ? "Did Already" : "Can't Do it today"} ==>`, error);
      logSentryError(error);
      // The resource already exists due to a conflicting request
      if (error?.response?.status === HTTP_STATUS_CONFLICT) {
        sendDataToWatchApp({ text: i18n.t("common.finished") });
        return;
      } else {
        Alert.alert(i18n.t("common.somethingWrong"));
        throw error;
      }
    });
};

export const syncCompletedActivities = () => async (dispatch, getState) => {
  const { unsyncedActivities } = getState().activity;
  addInfoLog("syncCompletedActivities ==>");
  if (unsyncedActivities && unsyncedActivities.length > 10) {
    const mapUnsyncedActivities = new Map(Object.entries(JSON.parse(unsyncedActivities)));
    const latestDateForCompletedActivities = Array.from(mapUnsyncedActivities)[mapUnsyncedActivities.size - 1][0];
    var arrUnSyncedActivitiesForLastDate = mapUnsyncedActivities.get(latestDateForCompletedActivities);

    dispatch(getCurrentActivityProps())
      .then((currentActivitiesResponse) => {
        if (currentActivitiesResponse?.current_sequence_completed_activities?.length > 0) {
          const currentSequenceCompletedActivities = currentActivitiesResponse?.current_sequence_completed_activities;
          arrUnSyncedActivitiesForLastDate = arrUnSyncedActivitiesForLastDate.filter(
            (activity) => !currentSequenceCompletedActivities.includes(activity?.activity_id),
          );
        }

        if (arrUnSyncedActivitiesForLastDate.length > 0) {
          const body = { completed_activites: arrUnSyncedActivitiesForLastDate };

          addInfoLog("Activities to sync Request Body==>");

          APIMethod({
            endpoint: APIURLS.syncCompletedActivities,
            body,
          })
            .then((resolve) => {
              addInfoLog("sync activities response ==>");
              // After successfull sync, clear all unsynced activities
              dispatch(saveUnsyncedActivities(""));
            })
            .catch((error) => {
              logAPIError("sync activities error ==>", error);
            });
        }
      })
      .catch((error) => {
        logAPIError("sync activities2 error ==>", error);
        const exception = new Error(error);
        logSentryError(exception);
      });
  }
};

export const logUserEvents = (event, properties) => {
  const user = store.getState().user;

  if (!user || !user.id) {
    return;
  }

  const userProperties = {
    distinct_id: user.id,
    USERNAME: user.nickname,
    APPVERSION: getAppVersion(),
    PLATFORM: platform,
  };

  const eventData = {
    event_type: event,
    event_data: properties,
    user_properties: userProperties,
    operating_system: platform,
  };

  store.dispatch(addEventToQueue(eventData));
};

export const sendBatchedEvents = async () => {
  const state = store.getState();
  const eventQueue = state.activity?.eventQueue ?? [];
  const isSendingEvents = state.activity?.isSendingEvents ?? false;

  if (!eventQueue || eventQueue.length === 0 || isSendingEvents) {
    return;
  }

  store.dispatch(setIsSendingEvents(true));

  const eventsToSend = [...eventQueue];
  const eventsCount = eventsToSend.length;

  try {
    await APIMethod({
      endpoint: "events",
      method: "POST",
      body: { events: eventsToSend },
      baseURL: "https://events.aws.focusbear.io/",
      enableErrorMessage: false,
    });

    addInfoLog("sendBatchedEvents response ==>", `Sent ${eventsCount} events`);

    const currentState = store.getState();
    const currentQueue = currentState.activity.eventQueue;

    if (currentQueue.length >= eventsCount) {
      const remainingEvents = currentQueue.slice(eventsCount);
      store.dispatch(clearEventQueue());
      remainingEvents.forEach((event) => {
        store.dispatch(addEventToQueue(event));
      });
    }
  } catch (error) {
    logAPIError("sendBatchedEvents error:", error);
  } finally {
    store.dispatch(setIsSendingEvents(false));
  }
};
