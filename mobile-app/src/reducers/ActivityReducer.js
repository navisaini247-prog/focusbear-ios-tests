import { TYPES } from "@/actions/ActivityActions";

const INITIAL_STATE = {
  completedActivityArray: [],
  newForegroundScheduleReceived: false,
  isPostPoneFlowFromDistractionAlert: false,
  unsyncedActivities: "",
  isBlocking: false,
  enableDndDuringHabit: false,
  eventQueue: [],
  isSendingEvents: false,
};

export const activityReducer = (state = INITIAL_STATE, { payload, type }) => {
  switch (type) {
    case TYPES.SET_ENABLE_DND_DURING_HABIT:
      return { ...state, enableDndDuringHabit: payload.data };
    case TYPES.FOREGROUND_SCHEDULE_METHOD:
      return { ...state, newForegroundScheduleReceived: payload.data };
    case TYPES.SET_POSTPONE_FLOW_FROM_DISTRACTION_ALERT_BOOL:
      return { ...state, isPostPoneFlowFromDistractionAlert: payload.data };
    case TYPES.SAVE_UNSYNCED_ACTIVITIES:
      return { ...state, unsyncedActivities: payload.data };
    case TYPES.SET_START_BLOCKING_APPS:
      return { ...state, isBlocking: true };
    case TYPES.SET_STOP_BLOCKING_APPS:
      return { ...state, isBlocking: false };
    case TYPES.ADD_EVENT_TO_QUEUE:
      return { ...state, eventQueue: [...(state.eventQueue || []), payload.data] };
    case TYPES.CLEAR_EVENT_QUEUE:
      return { ...state, eventQueue: [] };
    case TYPES.SET_IS_SENDING_EVENTS:
      return { ...state, isSendingEvents: payload.data };
    case TYPES.CLEAR_STORE:
      return { ...INITIAL_STATE };
    default:
      return state;
  }
};
