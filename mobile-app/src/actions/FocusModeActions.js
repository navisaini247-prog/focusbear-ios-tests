import { APIMethod } from "@/utils/ApiMethod";
import { APIURLS } from "@/utils/ApiUrls";
import { getCurrentActivityProps } from "./UserActions";
import { logAPIError } from "@/utils/FileLogger";
import { setSuperStrictModeNative } from "@/utils/NativeModuleMethods";

export const TYPES = {
  CLEAR_STORE: "CLEAR_STORE",
  FOCUS_MODE_START_SUCCESS: "FOCUS_MODE_START_SUCCESS",
  FOCUS_MODE_START_ERROR: "FOCUS_MODE_START_ERROR",
  FOCUS_MODE_START_REQUEST: "FOCUS_MODE_START_REQUEST",

  FOCUS_MODE_FINISH_SUCCESS: "FOCUS_MODE_FINISH_SUCCESS",
  FOCUS_MODE_FINISH_REQUEST: "FOCUS_MODE_FINISH_REQUEST",
  FOCUS_MODE_FINISH_ERROR: "FOCUS_MODE_FINISH_ERROR",

  FOCUS_MODE_GET_LIST_REQUEST: "FOCUS_MODE_GET_LIST_REQUEST",
  FOCUS_MODE_GET_LIST_SUCCESS: "FOCUS_MODE_GET_LIST_SUCCESS",
  FOCUS_MODE_GET_LIST_ERROR: "FOCUS_MODE_GET_LIST_ERROR",

  CHANGE_FOCUS_MODE_STATE: "CHANGE_FOCUS_MODE_STATE",
  HIDE_FOCUS_MODE_TOOL_TIP: "HIDE_FOCUS_MODE_TOOL_TIP",
  SHOW_FOCUS_MODE_TOOL_TIP: "SHOW_FOCUS_MODE_TOOL_TIP",

  SET_FOCUS_MODE_NOTES: "SET_FOCUS_MODE_NOTES",
  SET_IS_FOCUS_SUPER_STRICT_MODE: "SET_IS_FOCUS_SUPER_STRICT_MODE",
  SET_FOCUS_DURATION: "SET_FOCUS_DURATION",

  SET_ENABLE_DND_DURING_FOCUS: "SET_ENABLE_DND_DURING_FOCUS",
};

export const setEnableDndDuringFocus = (data) => ({
  type: TYPES.SET_ENABLE_DND_DURING_FOCUS,
  payload: { data },
});

export const setFocusDuration = (duration) => ({
  type: TYPES.SET_FOCUS_DURATION,
  payload: { duration },
});

export const setIsFocusSuperStrictMode = (isSuperStrictMode) => {
  setSuperStrictModeNative(isSuperStrictMode);
  return {
    type: TYPES.SET_IS_FOCUS_SUPER_STRICT_MODE,
    payload: { isSuperStrictMode },
  };
};

export const setFocusModeNotes = (state) => ({
  type: TYPES.SET_FOCUS_MODE_NOTES,
  payload: { state },
});

export const changeFocusModeState = (state) => ({
  type: TYPES.CHANGE_FOCUS_MODE_STATE,
  payload: { state },
});

export const showFocusModeToolTip = () => ({
  type: TYPES.SHOW_FOCUS_MODE_TOOL_TIP,
});

export const hideFocusModeToolTip = () => ({
  type: TYPES.HIDE_FOCUS_MODE_TOOL_TIP,
});

const focusModeStartRequest = () => ({
  type: TYPES.FOCUS_MODE_START_REQUEST,
  payload: null,
});

const focusModeStartError = (error) => ({
  type: TYPES.FOCUS_MODE_START_ERROR,
  payload: { error },
});

const focusModeStartSuccess = (data) => ({
  type: TYPES.FOCUS_MODE_START_SUCCESS,
  payload: { data },
});

const focusModeFinishRequest = () => ({
  type: TYPES.FOCUS_MODE_FINISH_REQUEST,
  payload: null,
});

const focusModeFinishError = (error) => ({
  type: TYPES.FOCUS_MODE_FINISH_ERROR,
  payload: { error },
});

const focusModeFinishSuccess = (data) => ({
  type: TYPES.FOCUS_MODE_FINISH_SUCCESS,
  payload: { data },
});

const focusModeGetListRequest = () => ({
  type: TYPES.FOCUS_MODE_GET_LIST_REQUEST,
  payload: null,
});

const focusModeGetListError = (error) => ({
  type: TYPES.FOCUS_MODE_GET_LIST_ERROR,
  payload: { error },
});

const focusModeGetListSuccess = (focusModes) => ({
  type: TYPES.FOCUS_MODE_GET_LIST_SUCCESS,
  payload: { focusModes },
});

export const getFocusModeList = () => async (dispatch, getState) => {
  dispatch(focusModeGetListRequest());
  APIMethod({
    endpoint: APIURLS.userFocusModes,
    method: "GET",
  })
    .then((response) => {
      dispatch(focusModeGetListSuccess(response?.data));
    })
    .catch((error) => {
      logAPIError("focus-mode-start error:", error);
    });
};

export const createNewFocusMode = (name, metadata) => async (dispatch, getState) => {
  const body = {
    name: name,
    metadata: metadata,
  };
  APIMethod({
    endpoint: APIURLS.focusMode,
    method: "POST",
    body: body,
    enableErrorMessage: false,
  })
    .then((response) => {
      dispatch(getFocusModeList());
    })
    .catch((error) => {
      logAPIError("focus-mode-create error:", error);
    });
};

export const startFocusMode =
  (focus_mode_id, startTime, finishTime, intention = "") =>
  async (dispatch, getState) => {
    const body = {
      intention,
      finish_time: finishTime,
      start_time: startTime,
    };

    APIMethod({
      endpoint: APIURLS.focusModeStart(focus_mode_id),
      method: "POST",
      body: body,
    })
      .then((response) => {
        dispatch(getCurrentActivityProps());
        dispatch(focusModeStartSuccess(response?.data));
      })
      .catch((error) => {
        logAPIError("focus-mode-start error:", error);
      });
  };

export const finishFocusMode =
  (focus_mode_id, finishTime, achievedInput, distractionInput, focus_duration_seconds) =>
  async (dispatch, getState) => {
    const body = {
      achievements: achievedInput,
      distractions: distractionInput,
      finish_time: finishTime,
      focus_duration_seconds,
    };
    APIMethod({
      endpoint: APIURLS.focusModeFinish(focus_mode_id),
      method: "POST",
      body: body,
    })
      .then((response) => {
        dispatch(getCurrentActivityProps());
        dispatch(focusModeFinishSuccess(response?.data));
      })
      .catch((error) => {
        logAPIError("focus-mode-finish error:", error);
      });
  };

export const updateFocusModeScheduledFinish = (focus_mode_id, newScheduledFinishTime) => async (dispatch, getState) => {
  const body = {
    scheduled_finish_time: newScheduledFinishTime,
  };
  try {
    await APIMethod({
      endpoint: APIURLS.focusModeUpdateScheduledFinish(focus_mode_id),
      method: "PATCH",
      body: body,
    });

    dispatch(getCurrentActivityProps());
  } catch (error) {
    logAPIError("focus-mode-update error:", error);
  }
};

export const getFocusMusicTrackList = () => async (dispatch, getState) => {
  try {
    const response = await APIMethod({
      endpoint: APIURLS.tracks,
      method: "GET",
    });
    return (response?.data || []).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    logAPIError("focus-mode-get-focus-music error:", error);
    return [];
  }
};
