export const getOverlayPermissionStatus = (state) => state.global.isOverlayPermissionGranted;

export const postponeActivatedStatusSelector = (state) => state.global.isPostoneActivated;

export const isUserCancelledOverlayPermissionStatusSelector = (state) => state.global.isUserCancelledOverlayPermission;

export const isUserCancelledUsagePermissionStatusSelector = (state) => state.global.isUserCancelledUsagePermission;

export const newUserDataSelector = (state) => state.global.newUserData;

export const isNewUserSelector = (state) => {
  const signupTime = state.global.newUserData?.signupTime;
  return new Date(signupTime).toDateString() === new Date().toDateString();
};

export const userLoginTimeSelector = (state) => state.global.userLoginTime;

export const showSleepMoodAnalyzeModalStatusSelector = (state) => state.global.showSleepMoodAnalyzeModal;

export const showSurveyModalStatusSelector = (state) => state.global.showSurveyModal;

export const isOnboardingStatusSelector = (state) => state.global.isOnboardingDone;

export const onBoardingProcessSelector = (state) => state.global.onboardingDefaultRoute;

export const isPushNotificationAskedStatusSelector = (state) => state.global.isPushNoticationPermissionAsked;

export const getPreLoadedInstalledApps = (state) => state.global.installedAppsData;

export const postponeStartTimeSelector = (state) => state.global.postponeStartTime;

export const postponeDurationSelector = (state) => state.global.postponeDuration;

export const postponeCountSelector = (state) => state.global.postponeCount;

export const blockedAppSelectionStatusSelector = (state) => state.global.blockedAppSelectionStatus;

export const allowedAppSelectionStatusSelector = (state) => state.global.allowedAppSelectionStatus;

export const blockedAppsCountDataFromIOSSelector = (state) => state.global.blockedAppsCountDataIOS;

export const showOpenAppMenuToolTipSelector = (state) => state.global.showOpenAppMenuToolTip;
export const showRoutineOptionsToolTipSelector = (state) => state.global.showRoutineOptionsToolTip;

export const onboardingStartFocusSessionFlagSelector = (state) => state.global.onboardingFocusSessionFlag;

export const onboardingEditHabitsFlagSelector = (state) => state.global.onboardingEditHabitsFlag;

export const onboardingMicroBreakFlagSelector = (state) => state.global.onboardingMicroBreakFlag;

export const focusGameCompletedFlagSelector = (state) => state.global.focusGameCompletedFlag;

export const isFocusSuperStrictModeSelector = (state) => state.focusMode.isSuperStrictMode;

export const launcherAppLabelSelector = (state) => state.global.launcherAppsLabel;

export const lastTimeLauncherFavouritesChangedSelector = (state) => state.global.lastTimeLauncherFavouritesChanged;

export const isFocusOnlyGoalSelectedSelector = (state) => state.global.isFocusOnlyGoalSelected;

export const appLanguageSelector = (state) => state.global.appLanguage;
export const appThemeSelector = (state) => state.global.appTheme;

export const debugLogPermissionSelector = (state) => state.global.debugLogPermission;

export const isAwsBackendEndpointActivatedSelector = (state) => state.global.isAwsBackendEndpointActivated;

export const timeUsedAfterCutoffShownDaySelector = (state) => state.global.timeUsedAfterCutoffShownDay;

export const stopShowingUsageAfterCutoffModalSelector = (state) => state.global.stopShowingUsageAfterCutoffModal;

export const manuallyEnrolledInUnicasStudySelector = (state) => state.global.manuallyEnrolledInUnicasStudy;

export const projectTagsSelector = (state) => state.global.projectTags ?? [];

export const projectTagsLoadingSelector = (state) => state.global.projectTagsLoading ?? false;

export const getForgotPasswordCoolDownSelector = (state) => state.global.coolDownEndTime;
export const frictionPasswordResetEndTimeSelector = (state) => state.global.frictionPasswordResetEndTime;

export const scheduleBlockingStatusSelector = (state) => state.global.scheduleBlockingStatus;
