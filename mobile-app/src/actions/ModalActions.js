export const TYPES = {
  SHOW_PASSWORD_MODAL: "SHOW_PASSWORD_MODAL",
  HIDE_PASSWORD_MODAL: "HIDE_PASSWORD_MODAL",
  PASSWORD_VERIFIED: "PASSWORD_VERIFIED",
  CLEAR_STORE: "CLEAR_STORE",
  SHOW_POSTPONE_MODAL: "SHOW_POSTPONE_MODAL",
  HIDE_POSTPONE_MODAL: "HIDE_POSTPONE_MODAL",
  SHOW_TASK_MODAL: "SHOW_TASK_MODAL",
  HIDE_TASK_MODAL: "HIDE_TASK_MODAL",
  CLEAR_TASK_MODAL_TASK_ID: "CLEAR_TASK_MODAL_TASK_ID",
  SHOW_STREAK_CELEBRATION_MODAL: "SHOW_STREAK_CELEBRATION_MODAL",
  HIDE_STREAK_CELEBRATION_MODAL: "HIDE_STREAK_CELEBRATION_MODAL",
};

/**
 * @param {Function} onPasswordVerified - Callback function to be executed when the password is successfully verified.
 * @param {Function} onVerificationCanceled - Callback function to be executed when the verification is canceled.
 * @param {boolean} forceShow - Whether to force show the modal regardless of other conditions
 */
export const showPasswordModal = ({ onPasswordVerified, onVerificationCanceled, forceShow }) => ({
  type: TYPES.SHOW_PASSWORD_MODAL,
  payload: { onPasswordVerified, onVerificationCanceled, forceShow },
});

export const hidePasswordModal = () => ({
  type: TYPES.HIDE_PASSWORD_MODAL,
});

export const passwordVerified = () => ({
  type: TYPES.PASSWORD_VERIFIED,
});

export const showPostponeModal = ({ pendingAppLaunch }) => ({
  type: TYPES.SHOW_POSTPONE_MODAL,
  payload: { pendingAppLaunch },
});

export const hidePostponeModal = () => ({
  type: TYPES.HIDE_POSTPONE_MODAL,
});

export const showTaskModal = ({ taskId }) => ({
  type: TYPES.SHOW_TASK_MODAL,
  payload: { taskId },
});

export const hideTaskModal = () => ({
  type: TYPES.HIDE_TASK_MODAL,
});

export const clearTaskModalTaskId = () => ({
  type: TYPES.CLEAR_TASK_MODAL_TASK_ID,
});

export const showStreakCelebrationModal = ({ streakType, streakCount }) => ({
  type: TYPES.SHOW_STREAK_CELEBRATION_MODAL,
  payload: { streakType, streakCount },
});

export const hideStreakCelebrationModal = () => ({
  type: TYPES.HIDE_STREAK_CELEBRATION_MODAL,
});
