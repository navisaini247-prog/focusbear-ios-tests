import { APIMethod } from "@/utils/ApiMethod";
import { APIURLS } from "@/utils/ApiUrls";
import { addInfoLog, logAPIError } from "@/utils/FileLogger";
import { getTimeZone } from "react-native-localize";
import { customRoutinesSelector, fullRoutineDataSelector } from "@/selectors/RoutineSelectors";
import { ACTIVITY_TYPE } from "@/constants/routines";
import { putUserSettings } from "./UserActions";

export const TYPES = {
  CLEAR_STORE: "CLEAR_STORE",
  FULL_ROUTINE_DATA: "FULL_ROUTINE_DATA",
  UPDATE_ROUTINE_COMPLETION_PROGRESS: "UPDATE_ROUTINE_COMPLETION_PROGRESS",
  CLEAR_ROUTINE_COMPLETION_PROGRESS: "CLEAR_ROUTINE_COMPLETION_PROGRESS",
  CLEAR_ACTIVITY_COMPLETION_PROGRESS: "CLEAR_ACTIVITY_COMPLETION_PROGRESS",
  RESET_ROUTINE_PROCESS: "RESET_ROUTINE_PROCESS",
  SET_CUT_OFF_TIME: "SET_CUT_OFF_TIME",
};

export const setCutOffTime = (time) => ({
  type: TYPES.SET_CUT_OFF_TIME,
  payload: { time },
});

export const routineDataAction = (data) => ({
  type: TYPES.FULL_ROUTINE_DATA,
  payload: { data },
});

export const updateActivityCompletionProgress = ({ id, duration, savedLogs }) => ({
  type: TYPES.UPDATE_ROUTINE_COMPLETION_PROGRESS,
  payload: {
    id,
    duration,
    savedLogs,
  },
});

export const clearSpecificActivityCompletionProgress = (id) => ({
  type: TYPES.CLEAR_ACTIVITY_COMPLETION_PROGRESS,
  payload: {
    id,
  },
});

export const clearActivityCompletionProgress = ({ clearTimeStamp }) => ({
  type: TYPES.CLEAR_ROUTINE_COMPLETION_PROGRESS,
  payload: {
    clearTimeStamp,
  },
});

export const clearRoutineProcess = () => ({
  type: TYPES.RESET_ROUTINE_PROCESS,
});

export const userRoutineDataAction = () => async (dispatch, getState) => {
  const timeZone = getTimeZone();
  addInfoLog("check user's timezone");
  return APIMethod({ endpoint: APIURLS.userSettings(timeZone), method: "GET" })
    .then((response) => {
      addInfoLog("Success userRoutineDataAction");
      dispatch(routineDataAction({ ...response?.data, lastTimeUserSettingsFetched: Date.now() }));
    })
    .catch((error) => {
      logAPIError("Error userRoutineDataAction", error);
    });
};

/**
 * Add a new custom routine.
 */
export const addCustomRoutine = (customRoutine) => async (dispatch, getState) => {
  const fullRoutineData = fullRoutineDataSelector(getState());
  const customRoutines = customRoutinesSelector(getState()) || [];

  const updatedRoutineData = {
    ...fullRoutineData,
    custom_routines: [...customRoutines, customRoutine],
  };

  await dispatch(putUserSettings(updatedRoutineData));
};

/**
 * Modify an existing custom routine. The routine object should contain the activity_sequence_id
 * to identify which routine to modify, along with the updated properties.
 */
export const modifyCustomRoutine = (customRoutine) => async (dispatch, getState) => {
  const fullRoutineData = fullRoutineDataSelector(getState());
  const customRoutines = customRoutinesSelector(getState()) || [];
  const { activity_sequence_id } = customRoutine;

  const updatedRoutineData = {
    ...fullRoutineData,
    custom_routines: customRoutines.map((routine) =>
      routine.activity_sequence_id === activity_sequence_id ? { ...routine, ...customRoutine } : routine,
    ),
  };

  await dispatch(putUserSettings(updatedRoutineData));
};

/**
 * Delete a custom routine. The activity_sequence_id is needed to identify the routine.
 */
export const deleteCustomRoutine =
  ({ activitySequenceId }) =>
  async (dispatch, getState) => {
    const fullRoutineData = fullRoutineDataSelector(getState());
    const customRoutines = customRoutinesSelector(getState()) || [];

    const updatedRoutineData = {
      ...fullRoutineData,
      custom_routines: customRoutines.filter((routine) => routine.activity_sequence_id !== activitySequenceId),
    };

    await dispatch(putUserSettings(updatedRoutineData));
  };

/**
 * Calculate routine data with an added activity (pure function)
 */
export const calculateRoutineDataWithAddedActivity = (fullRoutineData, activity) => {
  const { morning_activities = [], evening_activities = [], custom_routines = [] } = fullRoutineData;
  const { activity_type, activity_sequence_id } = activity;

  switch (activity_type) {
    case ACTIVITY_TYPE.MORNING:
      return {
        ...fullRoutineData,
        morning_activities: [...morning_activities, activity],
      };

    case ACTIVITY_TYPE.EVENING:
      return {
        ...fullRoutineData,
        evening_activities: [...evening_activities, activity],
      };

    case ACTIVITY_TYPE.STANDALONE:
      return {
        ...fullRoutineData,
        custom_routines: custom_routines.map((routine) => {
          if (routine.activity_sequence_id !== activity_sequence_id) return routine;

          const { standalone_activities = [] } = routine;
          return {
            ...routine,
            standalone_activities: [...standalone_activities, activity],
          };
        }),
      };

    default:
      return fullRoutineData;
  }
};

/**
 * Calculate routine data with a modified activity (pure function)
 */
export const calculateRoutineDataWithModifiedActivity = (fullRoutineData, activity) => {
  const { morning_activities = [], evening_activities = [], custom_routines = [] } = fullRoutineData;
  const { activity_type, activity_sequence_id, id } = activity;

  switch (activity_type) {
    case ACTIVITY_TYPE.MORNING:
      return {
        ...fullRoutineData,
        morning_activities: morning_activities.map((_activity) => (_activity.id === id ? activity : _activity)),
      };

    case ACTIVITY_TYPE.EVENING:
      return {
        ...fullRoutineData,
        evening_activities: evening_activities.map((_activity) => (_activity.id === id ? activity : _activity)),
      };

    case ACTIVITY_TYPE.STANDALONE:
      return {
        ...fullRoutineData,
        custom_routines: custom_routines.map((routine) => {
          if (routine.activity_sequence_id !== activity_sequence_id) return routine;

          const { standalone_activities = [] } = routine;
          return {
            ...routine,
            standalone_activities: standalone_activities.map((_activity) =>
              _activity.id === id ? activity : _activity,
            ),
          };
        }),
      };

    default:
      return fullRoutineData;
  }
};

/**
 * Calculate routine data with a deleted activity (pure function)
 */
export const calculateRoutineDataWithDeletedActivity = (fullRoutineData, { id, activityType, activitySequenceId }) => {
  const { morning_activities = [], evening_activities = [], custom_routines = [] } = fullRoutineData;

  switch (activityType) {
    case ACTIVITY_TYPE.MORNING:
      return {
        ...fullRoutineData,
        morning_activities: morning_activities.filter((_activity) => _activity.id !== id),
      };

    case ACTIVITY_TYPE.EVENING:
      return {
        ...fullRoutineData,
        evening_activities: evening_activities.filter((_activity) => _activity.id !== id),
      };

    case ACTIVITY_TYPE.STANDALONE:
      return {
        ...fullRoutineData,
        custom_routines: custom_routines.map((routine) => {
          if (routine.activity_sequence_id !== activitySequenceId) return routine;

          const { standalone_activities } = routine;
          return {
            ...routine,
            standalone_activities: standalone_activities.filter((_activity) => _activity.id !== id),
          };
        }),
      };

    default:
      return fullRoutineData;
  }
};

/**
 * Calculate routine data with reordered activities (pure function).
 */
export const calculateRoutineDataWithReorderedActivities = (
  fullRoutineData,
  { activityIds, type, activitySequenceId },
) => {
  const { morning_activities = [], evening_activities = [], custom_routines = [] } = fullRoutineData;

  const reorder = (activities) =>
    activityIds.map((id) => activities.find((activity) => activity.id === id)).filter(Boolean);

  switch (type) {
    case ACTIVITY_TYPE.MORNING:
      return {
        ...fullRoutineData,
        morning_activities: reorder(morning_activities),
      };

    case ACTIVITY_TYPE.EVENING:
      return {
        ...fullRoutineData,
        evening_activities: reorder(evening_activities),
      };

    case ACTIVITY_TYPE.STANDALONE:
      return {
        ...fullRoutineData,
        custom_routines: custom_routines.map((routine) => {
          if (routine.activity_sequence_id !== activitySequenceId) return routine;

          const { standalone_activities = [] } = routine;
          return {
            ...routine,
            standalone_activities: reorder(standalone_activities),
          };
        }),
      };

    default:
      return fullRoutineData;
  }
};

/**
 * Add a new activity. Receives just the activity object itself, which contains the activity_type and
 * activity_sequence_id of the destination routine.
 */
export const addActivity = (activity) => async (dispatch, getState) => {
  const fullRoutineData = fullRoutineDataSelector(getState());
  const updatedRoutineData = calculateRoutineDataWithAddedActivity(fullRoutineData, activity);

  await dispatch(putUserSettings(updatedRoutineData));
};

/**
 * Modify an existing activity. The activity object should contain the id, activity_type, and
 * activity_sequence_id to identify which activity to modify, along with the updated properties.
 */
export const modifyActivity = (activity) => async (dispatch, getState) => {
  const fullRoutineData = fullRoutineDataSelector(getState());
  const updatedRoutineData = calculateRoutineDataWithModifiedActivity(fullRoutineData, activity);

  await dispatch(putUserSettings(updatedRoutineData));
};

/**
 * Delete an activity. Receives the id, activityType, and activitySequenceId of the activity to be deleted.
 */
export const deleteActivity =
  ({ id, activityType, activitySequenceId }) =>
  async (dispatch, getState) => {
    const fullRoutineData = fullRoutineDataSelector(getState());
    const updatedRoutineData = calculateRoutineDataWithDeletedActivity(fullRoutineData, {
      id,
      activityType,
      activitySequenceId,
    });

    await dispatch(putUserSettings(updatedRoutineData));
  };

/**
 * Move an activity from one routine to another. Receives the activity with the new activity_type and
 * activity_sequence_id, and an options object with prevActivityType and prevActivitySequenceId of the source routine.
 */
export const moveActivity =
  (activity, { prevActivityType, prevActivitySequenceId }) =>
  async (dispatch, getState) => {
    const fullRoutineData = fullRoutineDataSelector(getState());

    // Delete from source routine
    const dataAfterDelete = calculateRoutineDataWithDeletedActivity(fullRoutineData, {
      id: activity.id,
      activityType: prevActivityType,
      activitySequenceId: prevActivitySequenceId,
    });

    const updatedRoutineData = calculateRoutineDataWithAddedActivity(dataAfterDelete, activity);

    await dispatch(putUserSettings(updatedRoutineData));
  };

/**
 * Reorder activities in a routine. Receives an array of activity IDs in the desired order,
 * along with the type and activitySequenceId to identify the routine.
 */
export const reorderRoutineActivities =
  ({ activityIds, type, activitySequenceId }) =>
  async (dispatch, getState) => {
    const fullRoutineData = fullRoutineDataSelector(getState());
    const updatedRoutineData = calculateRoutineDataWithReorderedActivities(fullRoutineData, {
      activityIds,
      type,
      activitySequenceId,
    });

    await dispatch(putUserSettings(updatedRoutineData));
  };

export const onStartMorningRoutineEarly = () => async (dispatch, getState) => {
  const fullRoutineData = fullRoutineDataSelector(getState());
  const currentDate = new Date();
  const currentTime = currentDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  await dispatch(putUserSettings({ ...fullRoutineData, startup_time: currentTime }));
};

export const suggestRoutine = async (params) => {
  return await APIMethod({ endpoint: APIURLS.routineSuggestion, method: "POST", data: params });
};

/**
 * Adjust habits using AI based on user feedback
 * @param {Object[]} currentHabits - Array of habit objects (UpdateActivityTemplateDto[])
 * @param {string} userFeedback - Natural language feedback from user
 * @param {Object} options - Optional params
 * @param {string[]} [options.userGoals] - Optional user goals
 * @param {number} [options.routineDuration] - Optional target routine duration in minutes
 * @returns {Promise<any>} Adjusted habit objects
 */
export const adjustHabitsWithAI = async (currentHabits, userFeedback, options = {}) => {
  const { userGoals, routineDuration } = options;

  const payload = {
    current_habits: currentHabits,
    user_feedback: userFeedback,
    ...(userGoals ? { user_goals: userGoals } : {}),
    ...(typeof routineDuration === "number" ? { routine_duration: routineDuration } : {}),
  };

  return await APIMethod({ endpoint: APIURLS.adjustHabitsWithAI, method: "POST", data: payload });
};

/**
 * Create habits using AI based on user prompt
 * @param {string} prompt - Prompt given by the user
 * @param {Object} options - Optional params
 * @param {string[]} [options.userGoals] - Optional user goals
 * @param {number} [options.routineDuration] - Optional target routine duration in minutes
 * @param {string} [options.routine]
 * @returns {Promise<any>} Response containing asyncTaskId
 */

export const createHabitsWithAI = async (prompt, options = {}) => {
  const { userGoals, routineDuration, routine } = options;

  const payload = {
    prompt: prompt,
    ...(userGoals ? { user_goals: userGoals } : {}),
    ...(typeof routineDuration === "number" ? { routine_duration: routineDuration } : {}),
    ...(routine ? { routine: routine } : {}),
  };

  return await APIMethod({ endpoint: APIURLS.createHabitsWithAIAsync, method: "POST", data: payload });
};

/**
 * Generate upload URL for habit import (image or audio)
 * @param {Object} params - Upload parameters
 * @param {string} params.mediaType - 'image' or 'audio'
 * @param {string} params.fileExtension - File extension (e.g., 'jpg', 'png', 'm4a')
 * @returns {Promise<any>} Response containing uploadUrl and mediaKey
 */
export const generateHabitImportUploadUrl = async ({ mediaType, fileExtension }) => {
  return await APIMethod({
    endpoint: APIURLS.habitImportGenerateUploadUrl,
    method: "POST",
    body: {
      mediaType,
      fileExtension,
    },
  });
};

/**
 * Trigger async habit import processing after file upload
 * @param {Object} params - Processing parameters
 * @param {string} params.mediaKey - Media key from upload URL response
 * @param {string} params.mediaType - 'image' or 'audio'
 * @returns {Promise<any>} Response containing asyncTaskId
 */
export const habitImportAsync = async ({ mediaKey, mediaType }) => {
  return await APIMethod({
    endpoint: APIURLS.habitImportAsync,
    method: "POST",
    body: {
      mediaKey,
      mediaType,
    },
  });
};

/**
 * Update user's long-term goals
 * @param {Object} params - Goals parameters
 * @param {string[]} params.goals - Array of goal strings
 * @returns {Promise<any>} API response
 */
export const updateLongTermGoals = async ({ goals }) => {
  return await APIMethod({
    endpoint: APIURLS.longTermGoals,
    method: "PUT",
    body: { goals },
  });
};
