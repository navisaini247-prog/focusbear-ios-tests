export const isPasswordModalVisibleSelector = (state) => state.modal.isPasswordModalVisible;

export const onPasswordVerifiedSelector = (state) => state.modal.onPasswordVerified;

export const onVerificationCanceledSelector = (state) => state.modal.onVerificationCanceled;

export const latestVerifiedTimestampSelector = (state) => state.modal.latestVerifiedTimestamp;

export const forceShowPasswordModalSelector = (state) => state.modal.forceShowPasswordModal;

export const isPostponeModalVisibleSelector = (state) => state.modal.isPostponeModalVisible;

export const pendingAppLaunchSelector = (state) => state.modal.pendingAppLaunch;

export const isTaskModalVisibleSelector = (state) => state.modal.isTaskModalVisible;

export const taskModalTaskIdSelector = (state) => state.modal.taskModalTaskId;

export const isStreakCelebrationModalVisibleSelector = (state) => state.modal.isStreakCelebrationModalVisible;

export const streakCelebrationCountSelector = (state) => state.modal.streakCount;

export const streakCelebrationTypeSelector = (state) => state.modal.streakType;
