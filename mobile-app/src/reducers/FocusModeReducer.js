import { TYPES } from "@/actions/FocusModeActions";

const INITIAL_STATE = {
  isInFocusMode: false,
  hideFocusModeToolTip: false,
  focusModesList: [],
  focusModeNotes: {
    intention: "",
    thoughts: "",
  },
  isSuperStrictMode: false,
  enableDndDuringFocus: true,
  focusDuration: { hours: 0, minutes: 0 },
};

export const focusModeReducer = (state = INITIAL_STATE, { payload, type }) => {
  switch (type) {
    case TYPES.FOCUS_MODE_GET_LIST_SUCCESS:
      return { ...state, focusModesList: payload.focusModes };
    case TYPES.FOCUS_MODE_START_SUCCESS:
      return { ...state, ...payload.user };
    case TYPES.FOCUS_MODE_FINISH_SUCCESS:
      return { ...state, ...payload.user };
    case TYPES.CHANGE_FOCUS_MODE_STATE:
      return { ...state, isInFocusMode: payload.state };
    case TYPES.HIDE_FOCUS_MODE_TOOL_TIP:
      return { ...state, hideFocusModeToolTip: true };
    case TYPES.SHOW_FOCUS_MODE_TOOL_TIP:
      return { ...state, hideFocusModeToolTip: false };
    case TYPES.SET_FOCUS_MODE_NOTES:
      return { ...state, focusModeNotes: payload.state };
    case TYPES.SET_IS_FOCUS_SUPER_STRICT_MODE:
      return { ...state, isSuperStrictMode: payload.isSuperStrictMode };
    case TYPES.SET_ENABLE_DND_DURING_FOCUS:
      return { ...state, enableDndDuringFocus: payload.data };
    case TYPES.SET_FOCUS_DURATION:
      return { ...state, focusDuration: payload.duration };
    case TYPES.CLEAR_STORE:
      return { ...INITIAL_STATE };
    default:
      return state;
  }
};

export const hideFocusModeToolTipSelector = (state) => state.focusMode.hideFocusModeToolTip;

export const focusModeNotesSelector = (state) => state.focusMode.focusModeNotes;

export const focusDurationSelector = (state) => state.focusMode.focusDuration;
