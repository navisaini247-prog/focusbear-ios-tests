import { TYPES } from "@/actions/GlobalActions";
import { NAVIGATION } from "@/constants";

const INITIAL_STATE = {
  isOverlayPermissionGranted: false,
  isPostoneActivated: false,
  isUserCancelledOverlayPermission: false,
  isUserCancelledUsagePermission: false,
  newUserData: {},
  userLoginTime: null,
  showSleepMoodAnalyzeModal: false,
  showSurveyModal: false,
  isOnboardingDone: false,
  onboardingDefaultRoute: NAVIGATION.UserAchievement,
  isPushNoticationPermissionAsked: false,
  postponeStartTime: null,
  postponeDuration: null,
  postponeCount: 0,
  blockedAppSelectionStatus: false,
  allowedAppSelectionStatus: false,
  blockedAppsCountDataIOS: {},
  blockingReason: "",
  isScreenTimePermissionGranted: false,
  showOpenAppMenuToolTip: true,
  showRoutineOptionsToolTip: true,
  onboardingFocusSessionFlag: false,
  onboardingEditHabitsFlag: false,
  onboardingMicroBreakFlag: false,
  focusGameCompletedFlag: false,
  installedAppsData: [],
  launcherAppsLabel: {},
  lastTimeLauncherFavouritesChanged: 0,
  isFocusOnlyGoalSelected: false,
  onboardingGoals: [],
  appLanguage: null,
  appTheme: "dark",
  debugLogPermission: null,
  motivationalSummaryShown: null,
  isAwsBackendEndpointActivated: false,
  isFirstAppOpenPostHogCaptured: false,
  recentBreathingExercise: {
    appName: null,
    packageId: null,
    bypassUntil: null,
    unblockingReason: null,
  },
  loggedActiveBypassPkgs: {},
  timeUsedAfterCutoffShownDay: 0,
  stopShowingUsageAfterCutoffModal: false,
  isHealthPermissionGranted: false,
  manuallyEnrolledInUnicasStudy: false,
  isPhysicalActivityPermissionDisabled: false,
  hasGoneThroughIntroduction: false,
  coolDownEndTime: null,
  frictionPasswordResetEndTime: null,
  juniorBearMode: "normal",
  pendingBearsona: null,
  floatingViewClosedOnButtonPress: false,
  projectTags: [],
  projectTagsLoading: false,
  projectTagsLastFetched: null,
  scheduleBlockingStatus: null,
};

export const globalReducer = (state = INITIAL_STATE, { payload, type }) => {
  switch (type) {
    case TYPES.SET_HAS_GONE_THROUGH_INTRODUCTION:
      return { ...state, hasGoneThroughIntroduction: payload.status };
    case TYPES.SET_OVERLAY_PERMISSION:
      return { ...state, isOverlayPermissionGranted: payload.status };
    case TYPES.SET_USER_CANCELLED_OVERLAY_PERMISSION:
      return { ...state, isUserCancelledOverlayPermission: payload.status };
    case TYPES.SET_USER_CANCELLED_USAGE_PERMISSION:
      return { ...state, isUserCancelledUsagePermission: payload.status };
    case TYPES.SET_POSTPONE_ACTIVATED:
      return { ...state, isPostoneActivated: payload.status };
    case TYPES.SET_IS_NEW_USER:
      return { ...state, newUserData: payload.data };
    case TYPES.SAVE_USER_LOGIN_TIME:
      return { ...state, userLoginTime: payload.time };
    case TYPES.SHOW_SLEEP_MOOD_ANALYZE_MODAL:
      return { ...state, showSleepMoodAnalyzeModal: payload.status };
    case TYPES.SHOW_SURVEY_MODAL:
      return { ...state, showSurveyModal: payload.status };
    case TYPES.SET_IS_ONBOARDING_STATUS:
      return { ...state, isOnboardingDone: payload.status };
    case TYPES.UPDATE_ONBOARDING_PROCESS:
      return { ...state, onboardingDefaultRoute: payload.route };
    case TYPES.UPDATE_PUSH_NOTIF_PERMISSION_ASKED_STATUS:
      return { ...state, isPushNoticationPermissionAsked: payload.status };
    case TYPES.POSTPONE_START_TIME:
      return { ...state, postponeStartTime: payload.startTime };
    case TYPES.POSTPONE_DURATION:
      return { ...state, postponeDuration: payload.duration };
    case TYPES.RESET_POSTPONE_COUNT:
      return { ...state, postponeCount: 0 };
    case TYPES.INCREMENT_POSTPONE_COUNT:
      return { ...state, postponeCount: (state.postponeCount || 0) + 1 };
    case TYPES.BLOCKED_APP_SELECTION_STATUS:
      return { ...state, blockedAppSelectionStatus: payload.status };
    case TYPES.ALLOWED_APP_SELECTION_STATUS:
      return { ...state, allowedAppSelectionStatus: payload.status };
    case TYPES.BLOCKED_APPS_COUNT_IOS:
      return { ...state, blockedAppsCountDataIOS: payload.appsCountData };
    case TYPES.SET_BLOCKING_REASON:
      return { ...state, blockingReason: payload.reason };
    case TYPES.SET_SCHEDULE_BLOCKING_STATUS:
      return { ...state, scheduleBlockingStatus: payload.scheduleBlockingStatus };
    case TYPES.SET_SCREEN_TIME_PERMISSION:
      return { ...state, isScreenTimePermissionGranted: payload.status };
    case TYPES.SET_OPEN_APP_MENU_TOOLTIP:
      return { ...state, showOpenAppMenuToolTip: payload.status };
    case TYPES.SET_ROUTINE_OPTIONS_TOOLTIP:
      return { ...state, showRoutineOptionsToolTip: payload.status };
    case TYPES.SET_ONBOARDING_FOCUS_SESSION_FLAG:
      return { ...state, onboardingFocusSessionFlag: payload.status };
    case TYPES.SET_ONBOARDING_EDIT_HABITS_FLAG:
      return { ...state, onboardingEditHabitsFlag: payload.status };
    case TYPES.SET_ONBOARDING_MICRO_BREAK_FLAG:
      return { ...state, onboardingMicroBreakFlag: payload.status };
    case TYPES.SET_FOCUS_GAME_COMPLETED_FLAG:
      return { ...state, focusGameCompletedFlag: payload.status };
    case TYPES.PRELOAD_INSTALLED_APPS:
      return { ...state, installedAppsData: payload.installedAppsData };
    case TYPES.SET_APP_LABEL:
      return {
        ...state,
        launcherAppsLabel: {
          ...state.launcherAppsLabel,
          [payload.packageName]: payload.labels,
        },
        lastTimeLauncherFavouritesChanged: Date.now(),
      };
    case TYPES.UPDATE_FOCUS_ONLY_GOAL:
      return { ...state, isFocusOnlyGoalSelected: payload };
    case TYPES.UPDATE_ONBOARDING_GOALS:
      return { ...state, onboardingGoals: payload };
    case TYPES.SET_APP_LANGUAGE:
      return { ...state, appLanguage: payload.language };
    case TYPES.SET_APP_THEME:
      return { ...state, appTheme: payload.theme };
    case TYPES.SET_DEBUG_LOG_PERMISSION:
      return { ...state, debugLogPermission: payload };
    case TYPES.SET_MOTIVATIONAL_SUMMARY_SHOWN:
      return { ...state, motivationalSummaryShown: payload.date };
    case TYPES.ACTIVATE_AWS_BACKEND_ENDPOINT:
      return { ...state, isAwsBackendEndpointActivated: payload.status };
    case TYPES.SET_FIRST_APP_OPEN_POSTHOG_CAPTURED:
      return { ...state, isFirstAppOpenPostHogCaptured: payload.status };
    case TYPES.SET_RECENT_BREATHING_EXERCISE:
      return { ...state, recentBreathingExercise: payload };
    case TYPES.SET_LOGGED_ACTIVE_BYPASS_PKG: {
      const pkg = payload?.pkg;
      if (!pkg) return state;

      return {
        ...state,
        loggedActiveBypassPkgs: {
          ...state.loggedActiveBypassPkgs,
          [pkg]: true,
        },
      };
    }

    case TYPES.CLEAR_LOGGED_ACTIVE_BYPASS_PKG: {
      const pkg = payload?.pkg;
      if (!pkg) return state;

      const { [pkg]: _, ...rest } = state.loggedActiveBypassPkgs;

      return {
        ...state,
        loggedActiveBypassPkgs: rest,
      };
    }
    case TYPES.SET_TIME_USED_AFTER_CUTOFF_SHOWN:
      return { ...state, timeUsedAfterCutoffShownDay: new Date().getDate() };
    case TYPES.SET_STOP_SHOWING_USAGE_AFTER_CUTOFF_MODAL:
      return { ...state, stopShowingUsageAfterCutoffModal: payload.status };
    case TYPES.CLEAR_STORE:
      // Push permission prompt can only be asked once, so we keep the state throughout the app
      return {
        ...INITIAL_STATE,
        isPushNoticationPermissionAsked: state.isPushNoticationPermissionAsked,
        isScreenTimePermissionGranted: state.isScreenTimePermissionGranted,
      };
    case TYPES.SET_HEALTH_PERMISSION_GRANTED:
      return { ...state, isHealthPermissionGranted: payload.status };
    case TYPES.SET_MANUALLY_ENROLLED_IN_UNICAS_STUDY:
      return { ...state, manuallyEnrolledInUnicasStudy: payload.status };
    case TYPES.SET_IS_PHYSICAL_ACTIVITY_PERMISSION_DISABLED:
      return { ...state, isPhysicalActivityPermissionDisabled: payload.status };
    case TYPES.FORGOT_PASSWORD_SET_COOLDOWN:
      return { ...state, coolDownEndTime: payload.endTime };
    case TYPES.FORGOT_PASSWORD_CLEAR_COOLDOWN:
      return { ...state, coolDownEndTime: null };
    case TYPES.FRICTION_PASSWORD_RESET_SET_COOLDOWN:
      return { ...state, frictionPasswordResetEndTime: payload.endTime };
    case TYPES.FRICTION_PASSWORD_RESET_CLEAR_COOLDOWN:
      return { ...state, frictionPasswordResetEndTime: null };
    case TYPES.SET_JUNIOR_BEAR_MODE:
      return { ...state, juniorBearMode: payload.mode };
    case TYPES.SET_PENDING_BEARSONA:
      return { ...state, pendingBearsona: payload.bearsonaName };
    case TYPES.CLEAR_PENDING_BEARSONA:
      return { ...state, pendingBearsona: null };
    case TYPES.SET_FLOATING_VIEW_CLOSED_ON_BUTTON_PRESS:
      return { ...state, floatingViewClosedOnButtonPress: payload.status };
    case TYPES.SET_PROJECT_TAGS:
      return {
        ...state,
        projectTags: payload.tags,
        projectTagsLastFetched: Date.now(),
      };
    case TYPES.SET_PROJECT_TAGS_LOADING:
      return { ...state, projectTagsLoading: payload.isLoading };
    default:
      return state;
  }
};
