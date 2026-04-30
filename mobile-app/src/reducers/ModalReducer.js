import { TYPES } from "@/actions/ModalActions";

// These states are deliberately excluded from redux persist
const INITIAL_STATE = {
  onPasswordVerified: () => {},
  onVerificationCanceled: () => {},
  latestVerifiedTimestamp: 0,
  forceShowPasswordModal: false,
  isPasswordModalVisible: false,
  isPostponeModalVisible: false,
  pendingAppLaunch: undefined,
  isTaskModalVisible: false,
  taskModalTaskId: null,
  isStreakCelebrationModalVisible: false,
  streakCount: 0,
  streakType: null,
};

export const modalReducer = (state = INITIAL_STATE, { payload, type }) => {
  switch (type) {
    case TYPES.SHOW_PASSWORD_MODAL:
      return {
        ...state,
        isPasswordModalVisible: true,
        onPasswordVerified: payload.onPasswordVerified,
        onVerificationCanceled: payload.onVerificationCanceled,
        forceShowPasswordModal: payload.forceShow,
      };
    case TYPES.HIDE_PASSWORD_MODAL:
      return {
        ...state,
        isPasswordModalVisible: false,
        onPasswordVerified: undefined,
        onVerificationCanceled: undefined,
      };
    case TYPES.PASSWORD_VERIFIED:
      return { ...state, latestVerifiedTimestamp: Date.now() };
    case TYPES.SHOW_POSTPONE_MODAL:
      return {
        ...state,
        isPostponeModalVisible: true,
        pendingAppLaunch: payload.pendingAppLaunch,
      };
    case TYPES.HIDE_POSTPONE_MODAL:
      return {
        ...state,
        isPostponeModalVisible: false,
        pendingAppLaunch: undefined, // Clear pending app launch
      };

    case TYPES.SHOW_TASK_MODAL:
      return {
        ...state,
        isTaskModalVisible: true,
        taskModalTaskId: payload.taskId,
      };
    case TYPES.HIDE_TASK_MODAL:
      return {
        ...state,
        isTaskModalVisible: false,
      };
    case TYPES.CLEAR_TASK_MODAL_TASK_ID:
      return {
        ...state,
        taskModalTaskId: null,
      };
    case TYPES.CLEAR_STORE:
      return { ...INITIAL_STATE };
    case TYPES.SHOW_STREAK_CELEBRATION_MODAL:
      return {
        ...state,
        isStreakCelebrationModalVisible: true,
        streakCount: payload.streakCount,
        streakType: payload.streakType,
      };
    case TYPES.HIDE_STREAK_CELEBRATION_MODAL:
      return {
        ...state,
        isStreakCelebrationModalVisible: false,
        streakCount: 0,
        streakType: null,
      };

    default:
      return state;
  }
};
