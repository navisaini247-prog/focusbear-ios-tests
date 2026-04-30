export const fullRoutineDataSelector = (state) => state.routine.fullRoutineData;

export const customRoutinesSelector = (state) => state.routine.fullRoutineData?.custom_routines;

export const cutOffTimeSelector = (state) =>
  state.routine.fullRoutineData?.cutoff_time_for_non_high_priority_activities;
export const startUpTimeSelector = (state) => state.routine.fullRoutineData?.startup_time;
export const shutDownTimeSelector = (state) => state.routine.fullRoutineData?.shutdown_time;

export const lastTimeUserSettingsFetchedSelector = (state) =>
  state.routine.fullRoutineData?.lastTimeUserSettingsFetched;

export const routineProcessSelector = (state) => state.routine.routineProcess;
export const clearRoutineProgressTimestampSelector = (state) => state.routine.clearRoutineProgressTimestamp;
