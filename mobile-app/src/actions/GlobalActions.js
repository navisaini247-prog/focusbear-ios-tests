import { APIMethod } from "@/utils/ApiMethod";
import { APIURLS } from "@/utils/ApiUrls";
import { addInfoLog, logAPIError } from "@/utils/FileLogger";
import { TIME_UNIT_CONVERT_FACTOR } from "@/constants";

export const TYPES = {
  CLEAR_STORE: "CLEAR_STORE",
  SET_OVERLAY_PERMISSION: "SET_OVERLAY_PERMISSION",
  SET_USER_CANCELLED_OVERLAY_PERMISSION: "SET_USER_CANCELLED_OVERLAY_PERMISSION",
  SET_USER_CANCELLED_USAGE_PERMISSION: "SET_USER_CANCELLED_USAGE_PERMISSION",
  SET_IS_NEW_USER: "SET_IS_NEW_USER",
  SAVE_USER_LOGIN_TIME: "SAVE_USER_LOGIN_TIME",
  SHOW_SLEEP_MOOD_ANALYZE_MODAL: "SHOW_SLEEP_MOOD_ANALYZE_MODAL",
  SHOW_SURVEY_MODAL: "SHOW_SURVEY_MODAL",
  SET_IS_ONBOARDING_STATUS: "SET_IS_ONBOARDING_STATUS",
  UPDATE_ONBOARDING_PROCESS: "UPDATE_ONBOARDING_PROCESS",
  UPDATE_PUSH_NOTIF_PERMISSION_ASKED_STATUS: "UPDATE_PUSH_NOTIF_PERMISSION_ASKED_STATUS",
  SET_POSTPONE_ACTIVATED: "SET_POSTPONE_ACTIVATED",
  POSTPONE_START_TIME: "POSTPONE_START_TIME",
  POSTPONE_DURATION: "POSTPONE_DURATION",
  RESET_POSTPONE_COUNT: "RESET_POSTPONE_COUNT",
  INCREMENT_POSTPONE_COUNT: "INCREMENT_POSTPONE_COUNT",
  BLOCKED_APP_SELECTION_STATUS: "BLOCKED_APP_SELECTION_STATUS",
  ALLOWED_APP_SELECTION_STATUS: "ALLOWED_APP_SELECTION_STATUS",
  BLOCKED_APPS_COUNT_IOS: "BLOCKED_APPS_COUNT_IOS",
  SET_BLOCKING_REASON: "SET_BLOCKING_REASON",
  SET_SCREEN_TIME_PERMISSION: "SET_SCREEN_TIME_PERMISSION",
  SET_OPEN_APP_MENU_TOOLTIP: "SET_OPEN_APP_MENU_TOOLTIP",
  SET_ROUTINE_OPTIONS_TOOLTIP: "SET_ROUTINE_OPTIONS_TOOLTIP",
  SET_ONBOARDING_FOCUS_SESSION_FLAG: "SET_ONBOARDING_FOCUS_SESSION_FLAG",
  SET_ONBOARDING_EDIT_HABITS_FLAG: "SET_ONBOARDING_EDIT_HABITS_FLAG",
  SET_ONBOARDING_MICRO_BREAK_FLAG: "SET_ONBOARDING_MICRO_BREAK_FLAG",
  SET_FOCUS_GAME_COMPLETED_FLAG: "SET_FOCUS_GAME_COMPLETED_FLAG",
  PRELOAD_INSTALLED_APPS: "PRELOAD_INSTALLED_APPS",
  SET_APP_LABEL: "SET_APP_LABEL",
  UPDATE_FOCUS_ONLY_GOAL: "UPDATE_FOCUS_ONLY_GOAL",
  UPDATE_ONBOARDING_GOALS: "UPDATE_ONBOARDING_GOALS",
  SET_APP_LANGUAGE: "SET_APP_LANGUAGE",
  SET_APP_THEME: "SET_APP_THEME",
  SET_DEBUG_LOG_PERMISSION: "SET_DEBUG_LOG_PERMISSION",
  SET_MOTIVATIONAL_SUMMARY_SHOWN: "SET_MOTIVATIONAL_SUMMARY_SHOWN",
  SET_FIRST_APP_OPEN_POSTHOG_CAPTURED: "SET_FIRST_APP_OPEN_POSTHOG_CAPTURED",
  ACTIVATE_AWS_BACKEND_ENDPOINT: "ACTIVATE_AWS_BACKEND_ENDPOINT",
  SET_RECENT_BREATHING_EXERCISE: "SET_RECENT_BREATHING_EXERCISE",
  SET_TIME_USED_AFTER_CUTOFF_SHOWN: "SET_TIME_USED_AFTER_CUTOFF_SHOWN",
  SET_STOP_SHOWING_USAGE_AFTER_CUTOFF_MODAL: "SET_STOP_SHOWING_USAGE_AFTER_CUTOFF_MODAL",
  SET_HEALTH_PERMISSION_GRANTED: "SET_HEALTH_PERMISSION_GRANTED",
  SET_MANUALLY_ENROLLED_IN_UNICAS_STUDY: "SET_MANUALLY_ENROLLED_IN_UNICAS_STUDY",
  SET_IS_PHYSICAL_ACTIVITY_PERMISSION_DISABLED: "SET_IS_PHYSICAL_ACTIVITY_PERMISSION_DISABLED",
  SET_HAS_GONE_THROUGH_INTRODUCTION: "SET_HAS_GONE_THROUGH_INTRODUCTION",
  SET_LOGGED_ACTIVE_BYPASS_PKG: "SET_LOGGED_ACTIVE_BYPASS_PKG",
  CLEAR_LOGGED_ACTIVE_BYPASS_PKG: "CLEAR_LOGGED_ACTIVE_BYPASS_PKG",
  FORGOT_PASSWORD_SET_COOLDOWN: "FORGOT_PASSWORD_SET_COOLDOWN",
  FORGOT_PASSWORD_CLEAR_COOLDOWN: "FORGOT_PASSWORD_CLEAR_COOLDOWN",
  FRICTION_PASSWORD_RESET_SET_COOLDOWN: "FRICTION_PASSWORD_RESET_SET_COOLDOWN",
  FRICTION_PASSWORD_RESET_CLEAR_COOLDOWN: "FRICTION_PASSWORD_RESET_CLEAR_COOLDOWN",
  SET_JUNIOR_BEAR_MODE: "SET_JUNIOR_BEAR_MODE",
  SET_PENDING_BEARSONA: "SET_PENDING_BEARSONA",
  CLEAR_PENDING_BEARSONA: "CLEAR_PENDING_BEARSONA",
  SET_FLOATING_VIEW_CLOSED_ON_BUTTON_PRESS: "SET_FLOATING_VIEW_CLOSED_ON_BUTTON_PRESS",
  SET_PROJECT_TAGS: "SET_PROJECT_TAGS",
  SET_PROJECT_TAGS_LOADING: "SET_PROJECT_TAGS_LOADING",
  SET_SCHEDULE_BLOCKING_STATUS: "SET_SCHEDULE_BLOCKING_STATUS",
};

export const setHasGoneThroughIntroduction = (status) => ({
  type: TYPES.SET_HAS_GONE_THROUGH_INTRODUCTION,
  payload: { status },
});

export const setJuniorBearMode = (mode) => ({
  type: TYPES.SET_JUNIOR_BEAR_MODE,
  payload: { mode },
});

export const setPendingBearsona = (bearsonaName) => ({
  type: TYPES.SET_PENDING_BEARSONA,
  payload: { bearsonaName },
});

export const clearPendingBearsona = () => ({
  type: TYPES.CLEAR_PENDING_BEARSONA,
});

export const setHealthPermissionGranted = (status) => ({
  type: TYPES.SET_HEALTH_PERMISSION_GRANTED,
  payload: { status },
});

export const setManuallyEnrolledInUnicasStudy = (status) => ({
  type: TYPES.SET_MANUALLY_ENROLLED_IN_UNICAS_STUDY,
  payload: { status },
});

export const setStopShowingUsageAfterCutoffModal = (status) => ({
  type: TYPES.SET_STOP_SHOWING_USAGE_AFTER_CUTOFF_MODAL,
  payload: { status },
});

export const setTimeUsedAfterCutoffShown = () => ({
  type: TYPES.SET_TIME_USED_AFTER_CUTOFF_SHOWN,
});

export const setRecentBreathingExercise = (appName, packageId, bypassUntil, unblockingReason) => ({
  type: TYPES.SET_RECENT_BREATHING_EXERCISE,
  payload: { appName, packageId, bypassUntil, unblockingReason },
});

export const setActivateAwsBackendEndpoint = ({ status }) => ({
  type: TYPES.ACTIVATE_AWS_BACKEND_ENDPOINT,
  payload: { status },
});

export const setDebugLogPermission = (status) => ({
  type: TYPES.SET_DEBUG_LOG_PERMISSION,
  payload: status,
});

export const setAppLabel = (packageName, labels) => ({
  type: TYPES.SET_APP_LABEL,
  payload: { packageName, labels },
});

export const setOnboardingFocusSessionFlag = (status) => ({
  type: TYPES.SET_ONBOARDING_FOCUS_SESSION_FLAG,
  payload: { status },
});

export const setOnboardingEditHabitsFlag = (status) => ({
  type: TYPES.SET_ONBOARDING_EDIT_HABITS_FLAG,
  payload: { status },
});

export const setOnboardingMicroBreakFlag = (status) => ({
  type: TYPES.SET_ONBOARDING_MICRO_BREAK_FLAG,
  payload: { status },
});

export const setFocusGameCompletedFlag = (status) => ({
  type: TYPES.SET_FOCUS_GAME_COMPLETED_FLAG,
  payload: { status },
});

export const setOpenAppMenuToolTip = (status) => ({
  type: TYPES.SET_OPEN_APP_MENU_TOOLTIP,
  payload: { status },
});

export const setRoutineOptionsToolTip = (status) => ({
  type: TYPES.SET_ROUTINE_OPTIONS_TOOLTIP,
  payload: { status },
});

export const setBlockingReason = (reason) => ({
  type: TYPES.SET_BLOCKING_REASON,
  payload: { reason },
});

export const setScheduleBlockingStatus = (scheduleBlockingStatus) => ({
  type: TYPES.SET_SCHEDULE_BLOCKING_STATUS,
  payload: { scheduleBlockingStatus },
});

export const setScreenTimePermission = (status) => ({
  type: TYPES.SET_SCREEN_TIME_PERMISSION,
  payload: { status },
});

export const setOverlayPermission = (status) => ({
  type: TYPES.SET_OVERLAY_PERMISSION,
  payload: { status },
});

export const setUserCancelledOverlayPermission = (status) => ({
  type: TYPES.SET_USER_CANCELLED_OVERLAY_PERMISSION,
  payload: { status },
});

export const setUserCancelledUsagePermission = (status) => ({
  type: TYPES.SET_USER_CANCELLED_USAGE_PERMISSION,
  payload: { status },
});

export const setPostponeActivated = (status) => ({
  type: TYPES.SET_POSTPONE_ACTIVATED,
  payload: { status },
});

export const setNewUserData = (data) => ({
  type: TYPES.SET_IS_NEW_USER,
  payload: { data },
});

export const saveUserLoginTime = (time) => ({
  type: TYPES.SAVE_USER_LOGIN_TIME,
  payload: { time },
});

export const showSleepMoodAnalyzeModal = (status) => ({
  type: TYPES.SHOW_SLEEP_MOOD_ANALYZE_MODAL,
  payload: { status },
});

export const showSurveyModal = (status) => ({
  type: TYPES.SHOW_SURVEY_MODAL,
  payload: { status },
});

export const setIsOnboardingStatus = (status) => ({
  type: TYPES.SET_IS_ONBOARDING_STATUS,
  payload: { status },
});

export const updateOnboardingProcess = (route) => ({
  type: TYPES.UPDATE_ONBOARDING_PROCESS,
  payload: { route },
});

export const updateIsPushNotificationAskedStatus = (status) => ({
  type: TYPES.UPDATE_PUSH_NOTIF_PERMISSION_ASKED_STATUS,
  payload: { status },
});

export const setPostponeStartTime = (startTime) => ({
  type: TYPES.POSTPONE_START_TIME,
  payload: { startTime },
});

export const setPostponeDuration = (duration) => ({
  type: TYPES.POSTPONE_DURATION,
  payload: { duration },
});

export const resetPostponeCount = () => ({
  type: TYPES.RESET_POSTPONE_COUNT,
  payload: null,
});

export const incrementPostponeCount = () => ({
  type: TYPES.INCREMENT_POSTPONE_COUNT,
  payload: null,
});

export const setBlockedAppSelectionStatus = (status) => ({
  type: TYPES.BLOCKED_APP_SELECTION_STATUS,
  payload: { status },
});

export const setAllowedAppSelectionStatus = (status) => ({
  type: TYPES.ALLOWED_APP_SELECTION_STATUS,
  payload: { status },
});

export const setBlockedAppsCountFromIOS = (appsCountData) => ({
  type: TYPES.BLOCKED_APPS_COUNT_IOS,
  payload: { appsCountData },
});

export const preLoadInstalledApps = (installedAppsData) => ({
  type: TYPES.PRELOAD_INSTALLED_APPS,
  payload: { installedAppsData },
});

export const updateFocusOnlyGoal = (payload) => ({
  type: TYPES.UPDATE_FOCUS_ONLY_GOAL,
  payload,
});

export const updateOnboardingGoals = (payload) => ({
  type: TYPES.UPDATE_ONBOARDING_GOALS,
  payload,
});

export const setAppLanguage = (language) => ({
  type: TYPES.SET_APP_LANGUAGE,
  payload: { language },
});

export const setAppTheme = (theme) => ({
  type: TYPES.SET_APP_THEME,
  payload: { theme },
});

export const setMotivationalSummaryShown = (date) => ({
  type: TYPES.SET_MOTIVATIONAL_SUMMARY_SHOWN,
  payload: { date },
});

export const setFirstAppOpenPostHogCaptured = (status) => ({
  type: TYPES.SET_FIRST_APP_OPEN_POSTHOG_CAPTURED,
  payload: { status },
});

export const setIsPhysicalActivityPermissionDisabled = (status) => ({
  type: TYPES.SET_IS_PHYSICAL_ACTIVITY_PERMISSION_DISABLED,
  payload: { status },
});

export const setLoggedActiveBypassPkg = (pkg) => ({
  type: TYPES.SET_LOGGED_ACTIVE_BYPASS_PKG,
  payload: { pkg },
});

export const clearLoggedActiveBypassPkg = (pkg) => ({
  type: TYPES.CLEAR_LOGGED_ACTIVE_BYPASS_PKG,
  payload: { pkg },
});

export const setCoolDown = (endTime) => ({
  type: TYPES.FORGOT_PASSWORD_SET_COOLDOWN,
  payload: { endTime },
});

export const clearCoolDown = () => ({
  type: TYPES.FORGOT_PASSWORD_CLEAR_COOLDOWN,
  payload: undefined,
});

export const setFrictionPasswordResetCoolDown = (endTime) => ({
  type: TYPES.FRICTION_PASSWORD_RESET_SET_COOLDOWN,
  payload: { endTime },
});

export const clearFrictionPasswordResetCoolDown = () => ({
  type: TYPES.FRICTION_PASSWORD_RESET_CLEAR_COOLDOWN,
  payload: undefined,
});

export const setFloatingViewClosedOnButtonPress = (status) => ({
  type: TYPES.SET_FLOATING_VIEW_CLOSED_ON_BUTTON_PRESS,
  payload: { status },
});

export const setProjectTags = (tags) => ({
  type: TYPES.SET_PROJECT_TAGS,
  payload: { tags },
});

export const setProjectTagsLoading = (isLoading) => ({
  type: TYPES.SET_PROJECT_TAGS_LOADING,
  payload: { isLoading },
});

const CACHE_VALIDITY_MINUTES = 5;

export const fetchProjectTags = () => async (dispatch, getState) => {
  const { projectTags, projectTagsLastFetched } = getState().global;
  const cacheValidityMs =
    CACHE_VALIDITY_MINUTES *
    TIME_UNIT_CONVERT_FACTOR.ONE_MINUTE_AS_SECONDS *
    TIME_UNIT_CONVERT_FACTOR.ONE_SECOND_AS_MILLISECONDS;
  const isCacheValid = projectTagsLastFetched && Date.now() - projectTagsLastFetched < cacheValidityMs;

  if (projectTags.length > 0 && isCacheValid) {
    return;
  }

  dispatch(setProjectTagsLoading(true));

  APIMethod({ endpoint: APIURLS.focusModeTags, method: "GET" })
    .then((response) => {
      addInfoLog("fetchProjectTags response ==>");
      const tags = response?.data ?? [];
      dispatch(setProjectTags(tags));
    })
    .catch((error) => {
      logAPIError("fetchProjectTags Error ==>", error);
    })
    .finally(() => {
      dispatch(setProjectTagsLoading(false));
    });
};
