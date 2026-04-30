import Auth0 from "react-native-auth0";
import { checkIsDev } from "./GlobalMethods";
import * as RNFS from "react-native-fs";
import { checkIsAndroid, checkIsIOS } from "./PlatformMethods";
import { AndroidImportance } from "@notifee/react-native";

const REGEX = {
  INTERNAL_TESTER_EMAIL: /^internaltest\+\w+@focusbear\.io$/,
};

const POSTHOG_EVENT_NAMES = {
  USER_OPEN_THE_APP_FOR_THE_FIRST_TIME: "user-open-the-app-for-the-first-time",
  LOGIN: "login",
  SIGNUP: "signup",
  SIGNIN_WITH_GOOGLE: "button-signin-with-google-clicked",
  SIGNIN_WITH_APPLE: "button-signin-with-apple-clicked",
  SIGNIN_AS_GUEST: "button-signin-as-guest-clicked",
  ALREADY_HAVE_AN_ACCOUNT: "already-have-an-account",
  AUTHENTICATION_ERROR: "authentication-error",
  PAUSE_ACTIVITY: "pause-activity",
  START_MORNING_ROUTINE: "start-morning-routine",
  COMPLETE_MORNING_ROUTINE_ACTIVITY: "complete-morning-routine-activity",
  COMPLETE_MORNING_ROUTINE: "complete-morning-routine",
  START_EVENING_ROUTINE: "start-evening-routine",
  COMPLETE_EVENING_ROUTINE_ACTIVITY: "complete-evening-routine-activity",
  COMPLETE_EVENING_ROUTINE: "complete-evening-routine",
  START_CUSTOM_ROUTINE: "start-custom-routine",
  COMPLETE_CUSTOM_ROUTINE: "complete-custom-routine",
  COMPLETE_CUSTOM_ROUTINE_ACTIVITY: "complete-custom-routine-activity",
  DEACTIVATE_ROUTINE_METADATA: "deactivate-routine-metadata",
  CHANGE_ALLOWED_APPS: "change-allowed-apps",
  PLAY_YOUTUBE_VIDEO: "play-youtube-video",
  PLAY_VIMEO_VIDEO: "play-vimeo-video",
  LOGOUT: "logout",
  BLOCK_DISTRACTION: "block-distraction",
  REQUEST_OVERLAY_PERMISSIONS: "request-overlay-permissions",
  REQUEST_USAGE_STATE_PERMISSIONS: "request-usage-state-permissions",
  POSTPONE_HABIT: "postpone-habit",
  SHOW_RECORD_IMPACT_PERMISSION: "show-recordimpact-permission",
  RECORD_IMPACT_PERMISSION_ALLOWED: "recordimpact-permission-allowed",
  RECORD_IMPACT_PERMISSION_DENIED: "recordimpact-permission-denied",
  IN_ONBOARDING: "in-onboarding",
  START_ROUTINE_ON_FIRST_DAY: "start-routine-on-first-day",
  DAY_OF_USAGE: "day-of-usage",
  NAVIGATE_TO_SETTINGS: "navigate-to-settings",
  BLOCK_DISTRACTION_DISABLED: "blocking-distraction-disabled",
  BLOCK_DISTRACTION_ENABLED: "blocking-distraction-enabled",
  PERIODIC_BACKGROUND_FETCH: "periodic-background-fetch",
  PERIODIC_BACKGROUND_BLOCKING: "automated-background-blocking-check",
  NAVIGATE_TO_HELP_SCREEN: "navigate-to-help-screen",
  NAVIGATE_TO_REPORT_PROBLEM: "navigate-to-report-problem",
  NAVIGATE_TO_DISCORD_SERVER: "navigate-to-discord-server",
  NAVIGATE_TO_TUTORIALS: "navigate-to-tutorials",
  DELETE_USER_ACCOUNT: "delete-user-account",
  FRICTION_HARD: "settings-changed-friction-for-skipping-hard",
  FRICTION_EASY: "settings-changed-friction-for-skipping-easy",
  LAUNCHER_PERMISSION_GRANTED: "launcher-permissions-granted",
  LAUNCHER_OPENED: "launcher-opened",
  LAUNCHER_REQUEST_STOP_BLOCKING: "launcher-request-stop-blocking",
  CUSTOM_GOAL_SELECTED: "custom-goal-selected",
  SUBSCRIPTION_EXPIRED_SCREEN_SHOWN: "subscription-expired-screen-shown",
  OPENING_VIDEO_TUTORIAL: "open-permission-video-tutorial",
  DND_DURING_FOCUS_ENABLED: "dnd-during-focus-enabled",
  DND_DURING_FOCUS_DISABLED: "dnd-during-focus-disabled",
  DND_DURING_HABITS_ENABLED: "dnd-during-habits-enabled",
  DND_DURING_HABITS_DISABLED: "dnd-during-habits-disabled",
  USER_CANCEL_FREEMIUM_ALERT: "user-cancel-freemium-alert",
  USER_ACCEPT_FREEMIUM_ALERT: "user-accept-freemium-alert",
  SOFT_BLOCK_ANDROID: "soft-block-android",
  SKIPPED_HABIT_CANNOT_DO_TODAY: "skipped-habit-cannot-do-today",
  SKIPPED_HABIT_ALREADY_DID_IT: "skipped-habit-already-did-it",
  CHOOSE_BEARSONA: "choose-bearsona",
  ONBOARDING_SKIPPED: "onboarding-skipped",
  HABIT_GENERATE_SKIP: "habit-generate-skip",
  ASK_FOR_HELP: "ask-for-help",
  USAGE_AFTER_SLEEP_GO_TO_FRICTION_SETTINGS: "usage-after-sleep-go-to-friction-settings",
  USAGE_AFTER_SLEEP_IGNORE_LIMIT: "usage-after-sleep-ignored",
  QUESTIONNAIRE_COMPLETED: "questionnaire-completed",
  EOS_QUESTIONNAIRE_COMPLETED: "eos-questionnaire-completed",
  CONSENT_FORM_COMPLETED: "consent-form-completed",

  // Sign-up events
  SIGNUP_VIA_GOOGLE_SUCCESS: "signup-via-google-success",
  SIGNUP_VIA_ANONYMOUSLY_SUCCESS: "signup-via-anonymously-success",
  SIGNUP_VIA_APPLE_SUCCESS: "signup-via-apple-success",
  SIGNUP_VIA_EMAIL_SUCCESS: "signup-via-email-success",
  USER_HAS_SEEN_PERMISSION_INTRO: "user-has-seen-permission-intro",

  VIEWING_PRIVACY_POLICY: "viewing-privacy-policy",
  AGREE_TO_TERMS_OF_SERVICE_AND_PRIVACY_POLICY: "agree-to-terms-of-service-and-privacy-policy",
  REQUEST_USAGE_PERMISSION: "request-usage-permission",
  REQUEST_OVERLAY_PERMISSION: "request-overlay-permission",
  REQUEST_NOTIFICATION_PERMISSIONS: "request-notification-permissions",
  REQUEST_ACCESSIBILITY_PERMISSION: "request-accessibility-permission",
  REQUEST_HEALTH_SLEEP_PERMISSION: "request-health-sleep-permission",
  REQUEST_PHYSICAL_ACTIVITY_PERMISSION: "request-physical-activity-permission",
  START_MICROBREAK_ACTIVITY: "started-microbreak-activity",
  COMPLETE_MICROBREAK_ACTIVITY: "complete-microbreak-activity",

  // Focus session
  START_FOCUS_MODE_MANUALLY: "start-focus-mode-manually",
  START_FOCUS_SESSION_MANUALLY_GUEST: "start-focus-session-manually-guest",
  COMPLETED_FOCUS_SESSION: "completed-focus-session",
  PLAY_FOCUS_MUSIC_TRACK: "played-focus-music-track",
  FOCUS_NOTES_MODAL_OPENED: "focus-notes-modal-opened",
  // Todos
  TODOS_OPEN_PRIORITIZE_SCREEN: "todos-open-prioritize-screen",
  TODOS_ADD_TASK: "todos-add-task",
  TODOS_ADJUST_DUE_DATE: "todos-adjust-due-date",
  TODOS_ADJUST_PRIORITIES: "todos-adjust-priorities",
  TODOS_USE_PERSPIRATION_FILTER: "todos-use-perspiration-filter",
  TODOS_USE_PROJECT_FILTER: "todos-use-project-filter",
  TODOS_FILTER_MODAL_OPENED: "todos-filter-modal-opened",
  TODOS_NOTES_MODAL_OPENED: "todos-notes-modal-opened",
  TODOS_FILTER_SELECTION_CHANGED: "todos-filter-selection-changed",
  TODOS_COMPLETE_TASK: "todos-complete-task",

  //Todos: Selected Time Horizon Filter
  TODOS_USE_OVERDUE_TIME_FILTER: "todos-use-overdue-time-filter",
  TODOS_USE_TODAY_TIME_FILTER: "todos-use-today-time-filter",
  TODOS_USE_TOMORROW_TIME_FILTER: "todos-use-tomorrow-time-filter",
  TODOS_USE_THIS_WEEK_TIME_FILTER: "todos-use-this-week-time-filter",
  TODOS_USE_NEXT_WEEK_TIME_FILTER: "todos-use-next-week-time-filter",
  TODOS_USE_LATER_TIME_FILTER: "todos-use-later-time-filter",

  // Todos: Audio and OCR
  TODOS_AUDIO_RECORD_START: "todos-audio-record-start",
  TODOS_AUDIO_RECORD_STOP: "todos-audio-record-stop",
  TODOS_AUDIO_UPLOAD_START: "todos-audio-upload-start",
  TODOS_AUDIO_UPLOAD_SUCCESS: "todos-audio-upload-success",
  TODOS_AUDIO_UPLOAD_FAILED: "todos-audio-upload-failed",
  TODOS_OCR_UPLOAD_START: "todos-ocr-upload-start",
  TODOS_OCR_UPLOAD_SENT: "todos-ocr-upload-sent",
  TODOS_OCR_COMPLETED: "todos-ocr-completed",
  TODOS_OCR_FAILED: "todos-ocr-failed",
  TODOS_AUDIO_FREEMIUM_BLOCKED: "todos-audio-freemium-blocked",
  TODOS_OCR_FREEMIUM_BLOCKED: "todos-ocr-freemium-blocked",
  // Onboarding: Habit Import
  ONBOARDING_HABIT_IMPORT_OPENED: "onboarding-habit-import-opened",
  ONBOARDING_HABIT_IMPORT_UPLOAD_START: "onboarding-habit-import-upload-start",
  ONBOARDING_HABIT_IMPORT_UPLOAD_SENT: "onboarding-habit-import-upload-sent",
  ONBOARDING_HABIT_IMPORT_COMPLETED: "onboarding-habit-import-completed",
  ONBOARDING_HABIT_IMPORT_FAILED: "onboarding-habit-import-failed",
  ONBOARDING_HABIT_IMPORT_RECORDING_STARTED: "onboarding-habit-import-recording-started",
  ONBOARDING_HABIT_LIST_IMPORT_CONFIRMED: "onboarding-habit-list-import-confirmed",
  ONBOARDING_HABIT_LIST_IMPORT_DECLINED: "onboarding-habit-list-import-declined",
  // Onboarding: Captain Bear Intro
  ONBOARDING_CAPTAIN_BEAR_INTRO_SCREEN_OPENED: "onboarding-captain-bear-intro-screen-opened",
  // Onboarding: Time Setup
  ONBOARDING_TIME_SETUP_OPENED: "onboarding-time-setup-opened",
  ONBOARDING_TECH_CURFEW_SELECTED: "onboarding-tech-curfew-selected",
  ONBOARDING_TECH_CURFEW_DECLINED: "onboarding-tech-curfew-declined",
  ONBOARDING_TECH_CURFEW_TIME_SET: "onboarding-tech-curfew-time-set",
  BACKEND_TIMED_OUT: "backend-timed-out",
  BACKEND_ERRORED_OUT: "backend-errored-out",
  NETWORK_ERROR: "network-error",
  ONBOARDING_REQUESTED_SOMETHING_ELSE: "onboarding-requested-something-else",

  // Routine
  ROUTINE_ADJUST_WITH_AI: "routine-adjust-with-ai",
  ROUTINE_ADD_HABIT: "routine-add-habit",
  ROUTINE_DELETE_HABIT: "routine-delete-habit",
  ROUTINE_EDIT_HABIT: "routine-edit-habit",
  ROUTINE_EDIT_MOVE_HABIT: "routine-edit-move-habit",
  ROUTINE_REORDER_HABIT: "routine-reorder-habit",
  ROUTINE_ADD_CUSTOM_ROUTINE: "routine-add-custom-routine",
  ROUTINE_EDIT_CUSTOM_ROUTINE: "routine-edit-custom-routine",
  ROUTINE_EDIT_MORNING_EVENING_ROUTINE: "routine-edit-morning-evening-routine",
  ROUTINE_EDIT_TIMING: "routine-edit-timing",
  NOTIFICATION_RECEIVED: "notification-received",
  // Junior Bear Conversation
  JUNIOR_BEAR_GREETING_PRIMARY_CLICKED: "junior-bear-greeting-primary-clicked",
  JUNIOR_BEAR_GREETING_SECONDARY_CLICKED: "junior-bear-greeting-secondary-clicked",
  JUNIOR_BEAR_PIRATE_MODE_ACCEPTED: "junior-bear-pirate-mode-accepted",
  JUNIOR_BEAR_ADHD_ACKNOWLEDGED: "junior-bear-adhd-acknowledged",
  JUNIOR_BEAR_ADHD_NOT_ISSUE: "junior-bear-adhd-not-issue",
  JUNIOR_BEAR_WHAT_HELP_OPTION_CLICKED: "junior-bear-what-help-option-clicked",
  JUNIOR_BEAR_TEAM_UP_PRIMARY_CLICKED: "junior-bear-team-up-primary-clicked",
  JUNIOR_BEAR_TEAM_UP_SECONDARY_CLICKED: "junior-bear-team-up-secondary-clicked",
  JUNIOR_BEAR_FOCUS_AREA_SELECTED: "junior-bear-focus-area-selected",
  JUNIOR_BEAR_FOCUS_AREA_DESELECTED: "junior-bear-focus-area-deselected",
  JUNIOR_BEAR_FOCUS_AREA_CONFIRMED: "junior-bear-focus-area-confirmed",
  JUNIOR_BEAR_SIGNUP_CLICKED: "junior-bear-signup-clicked",
  JUNIOR_BEAR_SIGNIN_AS_GUEST_CLICKED: "junior-bear-signin-as-guest-clicked",
  JUNIOR_BEAR_ALREADY_HAVE_ACCOUNT_CLICKED: "junior-bear-already-have-account-clicked",
  // Onboarding: User Achievement Goals
  ONBOARDING_USER_ACHIEVEMENT_SCREEN_OPENED: "onboarding-user-achievement-screen-opened",
  ONBOARDING_USER_ACHIEVEMENT_GOAL_SELECTED: "onboarding-user-achievement-goal-selected",
  ONBOARDING_USER_ACHIEVEMENT_CUSTOM_GOAL_TOGGLED: "onboarding-user-achievement-custom-goal-toggled",
  ONBOARDING_USER_ACHIEVEMENT_NEXT_CLICKED: "onboarding-user-achievement-next-clicked",
  // Onboarding: Routine Suggestion
  ONBOARDING_ROUTINE_SUGGESTION_SCREEN_OPENED: "onboarding-routine-suggestion-screen-opened",
  ONBOARDING_ROUTINE_SUGGESTION_CONTINUE_CLICKED: "onboarding-routine-suggestion-continue-clicked",
  ONBOARDING_ROUTINE_SUGGESTION_RETRY_CLICKED: "onboarding-routine-suggestion-retry-clicked",
  ONBOARDING_ROUTINE_SUGGESTION_CONTINUE_ERROR_CLICKED: "onboarding-routine-suggestion-continue-error-clicked",
  ONBOARDING_ROUTINE_SUGGESTION_AI_ADJUST_CLICKED: "onboarding-routine-suggestion-ai-adjust-clicked",
  ONBOARDING_ROUTINE_SUGGESTION_GENERATE_AI_CLICKED: "onboarding-routine-suggestion-generate-ai-clicked",
  // Onboarding: Simplified Schedule
  ONBOARDING_SIMPLIFIED_SCHEDULE_SCREEN_OPENED: "onboarding-simplified-schedule-screen-opened",
  ONBOARDING_SIMPLIFIED_SCHEDULE_NO_THANKS_CLICKED: "onboarding-simplified-schedule-no-thanks-clicked",
  ONBOARDING_SIMPLIFIED_SCHEDULE_YES_CLICKED: "onboarding-simplified-schedule-yes-clicked",
  ONBOARDING_SIMPLIFIED_SCHEDULE_CONFIRM_TIME_CLICKED: "onboarding-simplified-schedule-confirm-time-clicked",
  // Simple Home
  SIMPLE_HOME_SCREEN_OPENED: "simple-home-screen-opened",
  SIMPLE_HOME_SETUP_BLOCKING_APP_CLICKED: "simple-home-setup-blocking-app-clicked",
  SIMPLE_HOME_SETUP_NOTIF_APP_CLICKED: "simple-home-setup-notif-app-clicked",
  SIMPLE_HOME_SETUP_BLOCKING_URL_CLICKED: "simple-home-setup-blocking-url-clicked",
  SIMPLE_HOME_FOCUS_GAME_CLICKED: "simple-home-focus-game-clicked",
  SIMPLE_HOME_START_FOCUS_SESSION_CLICKED: "simple-home-start-focus-session-clicked",
  SIMPLE_HOME_START_MICRO_BREAK_CLICKED: "simple-home-start-micro-break-clicked",
  SIMPLE_HOME_CONTINUE_CLICKED: "simple-home-continue-clicked",
  SIMPLE_HOME_DO_IT_LATER_CLICKED: "simple-home-do-it-later-clicked",
  // Blocking schedules
  BLOCKING_SCHEDULE_LIST_OPENED: "blocking-schedule-list-opened",
  BLOCKING_SCHEDULE_ADD_NEW: "blocking-schedule-add-new",
  BLOCKING_SCHEDULE_CLEAR_ALL: "blocking-schedule-clear-all",
  BLOCKING_SCHEDULE_SELECT_APPS_GLOBAL: "blocking-schedule-select-apps-global",
  BLOCKING_SCHEDULE_TOGGLE_GLOBAL: "blocking-schedule-toggle-global",
  BLOCKING_SCHEDULE_SCREEN_OPENED: "blocking-schedule-screen-opened",
  BLOCKING_SCHEDULE_SAVE: "blocking-schedule-save",
  BLOCKING_SCHEDULE_REMOVE: "blocking-schedule-remove",
  // Blocking permission intro
  BLOCKING_PERMISSION_INTRO_STARTED: "blocking-permission-intro-started",
  BLOCKING_PERMISSION_INTRO_STEP_VIEWED: "blocking-permission-intro-step-viewed",
  BLOCKING_PERMISSION_INTRO_STEP_COMPLETED: "blocking-permission-intro-step-completed",
  BLOCKING_PERMISSION_INTRO_SKIPPED: "blocking-permission-intro-skipped",
  BLOCKING_PERMISSION_INTRO_FINISHED: "blocking-permission-intro-finished",
  // Edit habits
  MOBILE_WEBVIEW_LOAD_START: "mobile-edit-habits-webview-load-start",
  MOBILE_WEBVIEW_LOAD_SUCCESS: "mobile-webview-load-success",
  UPDATED_HABITS_VIA_WEBVIEW: "updated-habits-via-webview",
  // Home screen tabs
  HOME_SCREEN_CHANGE_TAB_HABITS: "home-screen-change-tab-habits",
  HOME_SCREEN_CHANGE_TAB_TODOS: "home-screen-change-tab-todos",
  HOME_SCREEN_CHANGE_TAB_OVERVIEW: "home-screen-change-tab-overview",
  EXPAND_HABIT: "expand-habit",
  VIEW_STREAK: "view-streak",
  // Bottom navigation
  BOTTOM_NAV_OVERVIEW: "bottom-nav-overview",
  BOTTOM_NAV_FOCUS: "bottom-nav-focus",
  BOTTOM_NAV_STATS: "bottom-nav-stats",
  BOTTOM_NAV_SETTINGS: "bottom-nav-settings",
  BOTTOM_NAV_LAUNCHER: "bottom-nav-launcher",
  // Permissions
  ACTIVATED_PERMISSION_USAGE_ACCESS: "activated-permission-usage-access",
  ACTIVATED_PERMISSION_OVERLAY: "activated-permission-overlay",
  ACTIVATED_PERMISSION_SCREEN_TIME: "activated-permission-screentime",
  ACTIVATED_PERMISSION_NOTIFICATIONS: "activated-permission-notifications",

  //Pause soft blocking
  PAUSE_SOFTBLOCKING_DETAILS: "pause_softblocking_details",

  SIGNUP_ERROR: "signup-error",
  SIGNIN_ERROR: "signin-error",

  //Create Routine with AI
  ROUTINE_CREATED_WITH_AI: "routine-created-with-ai",
};

const POSTHOG_PERSON_PROPERTIES = {
  APP_VERSION: "app_version",
  DAY_OF_USAGE: "day_of_usage",
  DISPLAY_SIZE: "display_size",
  FONT_SIZE_USED: "font_size_used",
  REASON_FOR_USING_FOCUSBEAR: "reason_for_using_focusbear",
  USAGE_PERMISSION_GRANTED: "usage_permission_granted",
  OVERLAY_PERMISSION_GRANTED: "overlay_permission_granted",
  SCREEN_TIME_PERMISSION_GRANTED: "screen_time_permission_granted",
  PERMISSION_SCREENTIME_ACTIVE: "permission_screentime_active",
  PERMISSION_OVERLAY_ACTIVE: "permission_overlay_active",
  PERMISSION_USAGE_ACCESS_ACTIVE: "permission_usage_access_active",
  PERMISSION_NOTIFICATIONS_ACTIVE: "permission_notifications_active",
  INTERNAL_TEST_USER: "internal_test_user",
};

const MENU = {
  SETTING: "SETTING",
  SPARE_ME: "SPARE_ME",
  SKIP_HABIT: "SKIP_HABIT",
};

const DEACTIVATE_REASONS = {
  EMERGENCY: "emergency",
  APP_BROKEN: "app_broken",
  SOMETHING_ELSE: "something_else",
};

const SOUND_ALERTS = {
  COMPLETE_HABIT_1: "completing_habit_1",
  COMPLETE_HABIT_2: "completing_habit_2",

  START_FOCUS_BUTTON_1: "start_focus_button_1",
  START_FOCUS_BUTTON_2: "start_focus_button_2",

  START_MORNING_EVENING_ROUTINE_1: "starting_morning_evening_routine_1",
  START_MORNING_EVENING_ROUTINE_2: "starting_morning_evening_routine_2",
  START_MORNING_EVENING_ROUTINE_3: "starting_morning_evening_routine_3",

  COMPLETE_MORNING_ROUTINE_1: "completing_whole_morning_routine_1",
  COMPLETE_MORNING_ROUTINE_2: "completing_whole_morning_routine_2",
  COMPLETE_MORNING_ROUTINE_3: "completing_whole_morning_routine_3",

  COMPLETE_EVENING_ROUTINE_1: "completing_whole_evening_routine_1",
  COMPLETE_EVENING_ROUTINE_2: "completing_whole_evening_routine_2",
  COMPLETE_EVENING_ROUTINE_3: "completing_whole_evening_routine_3",
};

const EMAIL_VALIDATION_ENUMS = {
  VALID_EMAIL: "VALID_EMAIL",
  INVALID_EMAIL: "INVALID_EMAIL",
};

const SECRET_AUTH0_KEY = {
  CLIENT_ID: checkIsDev() ? "9hhQ3ymKQQsrAHkHlrVYzMPoJ9VZqrJ8" : "cZ2J5dR8FliHiTyOdlyk18wKottWxPaC",
  DOMAIN: "dev-2hidr8ad.us.auth0.com",
};

const AUTH0 = new Auth0({
  domain: SECRET_AUTH0_KEY.DOMAIN,
  clientId: SECRET_AUTH0_KEY.CLIENT_ID,
});

const PUSHER = {
  API_KEY: "",
  EVENTS: {
    FOCUS_MODE_STARTED: "focus_mode-started",
    FOCUS_MODE_FINISHED: "focus_mode-finished",
    ACTIVITY_COMPLETED: "activity-completed",
  },
};

const SENTRY = {
  DSN: "",
};

const TAKE_LOGS = {
  DURING_ACTIVITY: "DURING_ACTIVITY",
  END_OF_ACTIVITY: "END_OF_ACTIVITY",
};

const WEB_URL = {
  PRIVACY_POLICY: "https://www.focusbear.io/privacy-policy",
  TERMS_CONDITIONS: "https://www.focusbear.io/terms-of-service",
  PRIVACY_POLICY_ES: "https://www.focusbear.io/es/privacy-policy",
  TERMS_CONDITIONS_ES: "https://www.focusbear.io/es/terms-of-service",
  EDIT_HABITS: "https://dashboard.focusbear.io/webview/settings",
  STATS: "https://dashboard.focusbear.io/webview/stats",
  SURVEY: "https://dashboard.focusbear.io/webview/survey",
  MOTIVATION: "https://dashboard.focusbear.io/webview/stats",
  MANAGE_SUBSCRIPTION: "https://dashboard.focusbear.io/manage-subscription",
  DISCORD: "https://discord.gg/VZdv3ZjhSq",
  HABIT_SUGGESTION: "https://dashboard.focusbear.io/webview/routine-suggestion",
  VIDEO_TUTORIALS: "https://dashboard.focusbear.io/webview/enrolled-courses",
  WEBVIEW_GET_SUPPORT: "https://dashboard.focusbear.io/webview/get-support",
  INTEGRATIONS: "https://dashboard.focusbear.io/integrations",
  NOTES: "https://dashboard.focusbear.io/webview/notes",
};

const CLIENT_ID = "dgMrlNC5mM634Sxi9SLqIqi0WvgVpwX7";

const REVENUECAT_API_KEY_APPLE = "";
const REVENUECAT_API_KEY_GOOGLE = "";

const ENTITLEMENT_ID_PERSONAL = "personal";
const ENTITLEMENT_ID_TRIAL = "trial";
const ENTITLEMENT_ID_TEAM_MEMBER = "team_member";

const MIME_TYPES = {
  TEXT: "text/plain",
  ZIP: "application/zip",
};

const DEFAULT_PLATFORMS = {
  ANDROID: "android",
  IOS: "ios",
};

// Note: screenshots are also put in the 'logs' zip/directory
const LOG_ZIP_NAME = "FocusBear-logs.zip";

const PLATFORM_SPECIFIC = {
  LOG_PATH: `${checkIsIOS() ? RNFS.DocumentDirectoryPath : RNFS.ExternalCachesDirectoryPath}/logs/`,
  ZIP_PATH: `${checkIsIOS() ? RNFS.DocumentDirectoryPath : RNFS.ExternalCachesDirectoryPath}/${LOG_ZIP_NAME}`,
  GET_FULL_PATH: (path) => `${checkIsAndroid() ? "file://" : ""}${path}`,
};

const ACTIVITY_PRIORITY = {
  HIGH: "HIGH",
  STANDARD: "STANDARD",
};

const IMPACT_REPORTING = {
  HABIT_PACK_ID: "f522e5d0-6e40-4dd4-9010-338529a7223e",
};

const FOCUS_ONLY = {
  HABIT_PACK_ID: "4a5872f5-a8e5-48c2-a2e3-83c3830fce58",
};

const SERVER_RESPONSE_MESSAGES = {
  USER_ALREADY_EXISTS: "The user already exists.",
};

const BLOCK_DISTRACTION_TYPES = {
  FOCUS_MODE: "FOCUS_MODE",
  ROUTINE: "ROUTINE",
  NOT_POSTPONED: "NOT_POSTPONED",
};

const APPLE_WATCH_ACTIVITY = {
  ACTIVITY_START_WITH_LOG_QUANTITY: "Activity_Start_with_LogQuantity",
  ROUTINE_HAS_BEEN_POSTPONED: "Routine_has_been_postponed",
};

const WATCH_ACTIVITY = {
  SEND_DATA_TO_RN: "sendDataToRN",
  MESSAGE: "message",
};

/**
 * WATCH_COMMAND is used to synchronize the watch app with the user's habits (routines).
 * For example, when the user opens the app in the morning, it will initially pass activity data with
 * SET_ACTIVITY_AT_START_OF_ROUTINE, so the activity name will be set on the watch app.
 * Also, when the user starts a different routine rather than a selected routine, it will pass an activity with SET_ACTIVITY_OUT_OF_ORDER.
 * When an activity is running and the user just wants to perform play/pause actions, it will pass the activity type as PLAY_OR_PAUSE_NEXT_LOGICAL_ACTIVITY.
 */
const WATCH_COMMAND = {
  /**
   * To set a new activity without starting it in the watch app,
   * pass activity data with the activity type as SET_ACTIVITY_AT_START_OF_ROUTINE.
   */
  SET_ACTIVITY_AT_START_OF_ROUTINE: "SET_ACTIVITY_AT_START_OF_ROUTINE",
  /**
   * To set a new activity in the watch app,
   * pass activity data with the activity type as SET_ACTIVITY_OUT_OF_ORDER.
   */
  SET_ACTIVITY_OUT_OF_ORDER: "SET_ACTIVITY_OUT_OF_ORDER",
  /**
   * When the user has started any activity,
   * at that time the user can perform play/pause actions by passing the activity type as PLAY_OR_PAUSE_NEXT_LOGICAL_ACTIVITY.
   */
  PLAY_OR_PAUSE_NEXT_LOGICAL_ACTIVITY: "PLAY_OR_PAUSE_NEXT_LOGICAL_ACTIVITY",
  SET_ACTIVITY_CONTINUE_ON_YOUR_PHONE: "SET_ACTIVITY_CONTINUE_ON_YOUR_PHONE",
};

const FOCUS_BEAR_WEB_URL = "https://focusbear.io";
const SUBSCRIPTION_SKU = "focus_bear_mobile";

const RESTRICTED_APPS_LIST_TYPE = {
  ALLOW_LIST: "ALLOW_LIST",
  BLOCK_LIST: "BLOCK_LIST",
};

const USER_LOCAL_DEVICE_SETTINGS_KEYS = {
  ALWAYS_ALLOWED_APPS: "always_allowed_apps",
  ALWAYS_BLOCKED_APPS: "always_blocked_apps",
};

const APP_LIST_TYPE = {
  [RESTRICTED_APPS_LIST_TYPE.ALLOW_LIST]: USER_LOCAL_DEVICE_SETTINGS_KEYS.ALWAYS_ALLOWED_APPS,
  [RESTRICTED_APPS_LIST_TYPE.BLOCK_LIST]: USER_LOCAL_DEVICE_SETTINGS_KEYS.ALWAYS_BLOCKED_APPS,
};

const FOCUS_TYPE = {
  MOBILE_FOCUS: "mobile-focus",
};

const NOTIFICATION_ID = {
  // For the android foreground service, wich the user sees as "Focus bear background service"
  FOREGROUND_SERVICE: "FOREGROUND_SERVICE",
  // Focus session completed notifications
  FOCUS: "FOCUS",
  // Resume routine and routine/activity completed notifications
  ROUTINE: "ROUTINE",
  // Late No More meeting reminder notifications
  LATE_NO_MORE: "LATE_NO_MORE",
};

// Notification channels for android
const NOTIFICATION_CHANNELS = {
  [NOTIFICATION_ID.FOREGROUND_SERVICE]: {
    NAME: "Background Service",
    IMPORTANCE: AndroidImportance.LOW,
  },
  [NOTIFICATION_ID.FOCUS]: {
    NAME: "Focus sessions",
    IMPORTANCE: AndroidImportance.HIGH,
  },
  [NOTIFICATION_ID.ROUTINE]: {
    NAME: "Routines",
    IMPORTANCE: AndroidImportance.HIGH,
  },
  [NOTIFICATION_ID.LATE_NO_MORE]: {
    NAME: "Meeting Reminders",
    IMPORTANCE: AndroidImportance.HIGH,
  },
};

const NOTIFICATION_PRESS_ID = {
  FOREGROUND_SERVICE: "FOREGROUND_SERVICE",
  ACTIVITY_COMPLETED: "ACTIVITY_COMPLETED",
  ROUTINE_COMPLETED: "ROUTINE_COMPLETED",
  RESUME_ROUTINE: "RESUME_ROUTINE",
  DISMISS_EVENT: "DISMISS_EVENT",
};

export {
  SUBSCRIPTION_SKU,
  POSTHOG_EVENT_NAMES,
  POSTHOG_PERSON_PROPERTIES,
  SOUND_ALERTS,
  EMAIL_VALIDATION_ENUMS,
  AUTH0,
  MENU,
  DEACTIVATE_REASONS,
  PUSHER,
  SENTRY,
  TAKE_LOGS,
  WEB_URL,
  CLIENT_ID,
  SECRET_AUTH0_KEY,
  REVENUECAT_API_KEY_APPLE,
  ENTITLEMENT_ID_PERSONAL,
  ENTITLEMENT_ID_TRIAL,
  ENTITLEMENT_ID_TEAM_MEMBER,
  REVENUECAT_API_KEY_GOOGLE,
  MIME_TYPES,
  LOG_ZIP_NAME,
  PLATFORM_SPECIFIC,
  DEFAULT_PLATFORMS,
  ACTIVITY_PRIORITY,
  REGEX,
  IMPACT_REPORTING,
  SERVER_RESPONSE_MESSAGES,
  BLOCK_DISTRACTION_TYPES,
  APPLE_WATCH_ACTIVITY,
  WATCH_ACTIVITY,
  WATCH_COMMAND,
  FOCUS_BEAR_WEB_URL,
  RESTRICTED_APPS_LIST_TYPE,
  APP_LIST_TYPE,
  USER_LOCAL_DEVICE_SETTINGS_KEYS,
  FOCUS_ONLY,
  FOCUS_TYPE,
  NOTIFICATION_ID,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRESS_ID,
};
