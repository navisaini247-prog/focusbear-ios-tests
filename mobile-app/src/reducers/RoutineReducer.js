import { TYPES } from "@/actions/RoutineActions";

const INITIAL_STATE = {
  fullRoutineData: {
    cutoff_time_for_non_high_priority_activities: "22:00",
  },
  routineProcess: {},
  clearRoutineProgressTimestamp: 0,
};

export const routineReducer = (state = INITIAL_STATE, { payload, type }) => {
  switch (type) {
    case TYPES.FULL_ROUTINE_DATA:
      return { ...state, fullRoutineData: payload.data };
    case TYPES.UPDATE_ROUTINE_COMPLETION_PROGRESS:
      return {
        ...state,
        routineProcess: {
          ...state.routineProcess,
          [payload.id]: { duration: payload.duration, savedLogs: payload.savedLogs },
        },
      };
    case TYPES.CLEAR_ROUTINE_COMPLETION_PROGRESS:
      return {
        ...state,
        routineProcess: {},
        clearRoutineProgressTimestamp: payload.clearTimeStamp,
      };
    case TYPES.CLEAR_ACTIVITY_COMPLETION_PROGRESS: {
      const { [payload.id]: _removedItem, ...routineProcess } = state.routineProcess || {};

      return { ...state, routineProcess };
    }
    case TYPES.RESET_ROUTINE_PROCESS:
      return { ...state, routineProcess: {} };
    case TYPES.SET_CUT_OFF_TIME:
      return {
        ...state,
        fullRoutineData: { ...state.fullRoutineData, cutoff_time_for_non_high_priority_activities: payload.time },
      };
    case TYPES.CLEAR_STORE:
      return { ...INITIAL_STATE };
    default:
      return state;
  }
};
