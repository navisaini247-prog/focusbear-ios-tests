import { TYPES } from "@/actions/UserActions";
import { ACTIVITY_TYPE } from "@/constants/routines";
import { isEmpty } from "lodash";

const INITIAL_STATE = {
  allowedAppsData: [],
  userLocalDeviceSettingsData: {},
  onBoardingHabitPackData: [],
  installedHabitPackData: {},
  userSubscriptionDetails: {},
  isMotivationMessageShown: false,
  privacyPolicyConsented: false,
  userConsentToPrivacyPolicyLogged: false,
  previousFocusSession: null,
  nickname: null,
  appsUsage: {},
  ignoredApps: [],
  studyCode: null,
  studyCodeEmail: null,
  isParticipantCodeLinked: false,
  hasCompletedFlanker: false,
  hasCompletedAfterStudyFlanker: false,
  hasCompletedQuestionnaire: false,
  hasCompletedConsentForm: false,
  hasCompletedEoSQuestionnaire: false,
  tasks: [],
  unfetchedTasksCounts: {},
  draftTodos: [],
  blockingSchedules: [],
  hasSeenPermissionIntro: false,
  lateNoMoreEvents: [],
  lateNoMoreDismissedEvents: [],
  lateNoMoreConnectedPlatforms: {},
  lateNoMoreNotificationsEnabled: true,
  lateNoMoreReminderTimes: [2, 15],
  lateNoMoreRequireMeetingUrl: false,
  hasDoneDailyMorningSession: false,
  hasDoneDailyEveningSession: false,
  hasDoneDailyFocusSession: false,
  hasCompletedFocusModeFirstTime: false,
  lastResetDate: null,
  activityAutostartEnabled: false,
};

const updateBlockedAppUsage = (state, packageName) => {
  if (!packageName) {
    return state?.appsUsage;
  }

  const existingApp = state?.appsUsage?.[packageName];

  let updatedAppsUsage;
  if (existingApp) {
    // App exists, increment block count
    updatedAppsUsage = {
      ...state.appsUsage,
      [packageName]: {
        ...existingApp,
        blockCount: (existingApp.blockCount || 0) + 1,
        lastBlockedAt: Date.now(),
      },
    };
  } else {
    // New app, add to object with initial count
    updatedAppsUsage = {
      ...state.appsUsage,
      [packageName]: {
        packageName,
        blockCount: 1,
        lastBlockedAt: Date.now(),
      },
    };
  }

  return updatedAppsUsage;
};

export const userReducer = (state = INITIAL_STATE, { payload, type }) => {
  switch (type) {
    case TYPES.LOGIN_SUCCESS:
      return { ...state, ...payload.user };
    case TYPES.USER_DETAILS_SUCCESS: {
      // Destructure focus_modes out so it is not spread into user state.
      // The dedicated GET /user/focus-modes endpoint (via getFocusModeList) owns
      // this data and stores it in state.focusMode.focusModesList. Excluding it
      // here prevents stale/duplicate data when the backend fully removes
      // focus_modes from GET /user/details.
      const { focus_modes: _focusModes, ...restUserDetails } = payload.userDetails ?? {};
      return {
        ...state,
        ...restUserDetails,
        previousFocusSession: isEmpty(state?.previousFocusSession)
          ? payload?.userDetails?.completing_focus_block
          : state?.previousFocusSession,
        morning_routines_streak: Math.max(
          state.morning_routines_streak || 0,
          restUserDetails?.morning_routines_streak || 0,
        ),
        evening_routines_streak: Math.max(
          state.evening_routines_streak || 0,
          restUserDetails?.evening_routines_streak || 0,
        ),
        focus_modes_streak: Math.max(state.focus_modes_streak || 0, restUserDetails?.focus_modes_streak || 0),
      };
    }
    case TYPES.UPDATE_CURRENT_SEQUENCE_COMPLETED_ACTIVITIES:
      return { ...state, current_sequence_completed_activities: payload.data };
    case TYPES.UPDATE_CURRENT_SEQUENCE_SKIPPED_ACTIVITIES:
      return { ...state, current_sequence_skipped_activities: payload.data };
    case TYPES.SET_SPECIFIC_ROUTINE_PROGRESS: {
      switch (payload.routineType) {
        case ACTIVITY_TYPE.MORNING:
          return {
            ...state,
            today_routine_progress: {
              ...state.today_routine_progress,
              morning_routine: payload.routineProgress,
            },
          };
        case ACTIVITY_TYPE.EVENING:
          return {
            ...state,
            today_routine_progress: {
              ...state.today_routine_progress,
              evening_routine: payload.routineProgress,
            },
          };
        case ACTIVITY_TYPE.STANDALONE:
          return {
            ...state,
            today_routine_progress: {
              ...state.today_routine_progress,
              custom_routines: [
                ...(state.today_routine_progress?.custom_routines || []).filter(
                  (_routineProgress) => _routineProgress?.sequence_id !== payload.routineProgress?.sequence_id,
                ),
                payload.routineProgress,
              ],
            },
          };
        default:
          return state;
      }
    }
    case TYPES.USER_LOCAL_DEVICE_SETTINGS_SUCCESS:
      return { ...state, userLocalDeviceSettingsData: payload.userLocalDeviceSettings };
    case TYPES.ALLOWED_APPS:
      return { ...state, allowedAppsData: payload.allowedApps };
    case TYPES.ONBOARDING_HABIT_PACK_LIST:
      return { ...state, onBoardingHabitPackData: payload.onBoardingHabitPackData };
    case TYPES.ONBOARDING_INSTALL_HABIT_PACK:
      return { ...state, installedHabitPackData: payload.installedHabitPackData };
    case TYPES.USER_SUBSCRIPTION_DATA:
      return { ...state, userSubscriptionDetails: payload.userSubscriptionDetails };
    case TYPES.IS_MOTIVATION_MESSAGE_SHOWN:
      return { ...state, isMotivationMessageShown: payload.isMotivationMessageShown };
    case TYPES.USER_DEVICE_DATA_SUCCESS:
      return { ...state, deviceData: payload.data };
    case TYPES.USER_CONSENTED_TO_PRIVACY_POLICY:
      return { ...state, privacyPolicyConsented: true };
    case TYPES.LOG_USER_CONSENT_STATUS:
      return { ...state, userConsentToPrivacyPolicyLogged: true };
    case TYPES.CLEAR_PREVIOUS_FOCUS_SESSION:
      return { ...state, previousFocusSession: null };
    case TYPES.UPDATE_ACCESS_TOKEN:
      return { ...state, accessToken: payload.accessToken };
    case TYPES.UPDATE_AUTH_TOKEN:
      return { ...state, ...payload.data };
    case TYPES.UPDATE_USER_NICKNAME:
      return { ...state, nickname: payload.nickname };
    case TYPES.SET_APPS_USAGE:
      return { ...state, appsUsage: payload.appsUsage };
    case TYPES.SET_BLOCKED_APP:
      return {
        ...state,
        appsUsage: updateBlockedAppUsage(state, payload?.packageName),
      };
    case TYPES.SET_IGNORED_APP:
      return {
        ...state,
        ignoredApps: [...state.ignoredApps, payload.packageName],
      };
    case TYPES.REGISTERED_PARTICIPANT_CODE_EMAIL:
      return { ...state, studyCode: payload.code, studyCodeEmail: payload.email };
    case TYPES.SET_PARTICIPANT_CODE_LINKED:
      return { ...state, isParticipantCodeLinked: payload.isParticipantCodeLinked };
    case TYPES.CLEAR_STORE:
      return { ...INITIAL_STATE };
    case TYPES.SET_HAS_COMPLETED_FLANKER:
      return {
        ...state,
        hasCompletedFlanker: payload.hasCompleted,
      };
    case TYPES.SET_HAS_COMPLETED_AFTER_STUDY_FLANKER:
      return {
        ...state,
        hasCompletedAfterStudyFlanker: payload.hasCompleted,
      };
    case TYPES.SET_HAS_COMPLETED_QUESTIONNAIRE:
      return {
        ...state,
        hasCompletedQuestionnaire: payload.hasCompleted,
      };
    case TYPES.SET_HAS_COMPLETED_EOS_QUESTIONNAIRE:
      return {
        ...state,
        hasCompletedEoSQuestionnaire: payload.hasCompleted,
      };
    case TYPES.SET_HAS_COMPLETED_CONSENT_FORM:
      return {
        ...state,
        hasCompletedConsentForm: payload.hasCompleted,
      };
    case TYPES.SET_TASKS:
      return { ...state, tasks: payload.tasks };
    case TYPES.ADD_TASK:
      return { ...state, tasks: [...(state.tasks || []), payload.task] };
    case TYPES.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === payload.task.id ? { ...payload.task } : task)),
      };
    case TYPES.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== payload.id),
      };
    case TYPES.SET_UNLOADED_COUNT:
      return {
        ...state,
        unfetchedTasksCounts: {
          ...state.unfetchedTasksCounts,
          [payload.status]: payload.count,
        },
      };
    case TYPES.SET_DRAFT_TODOS:
      return { ...state, draftTodos: payload.draftTodos };
    case TYPES.ADD_DRAFT_TODO:
      return { ...state, draftTodos: [...state.draftTodos, payload.draftTodo] };
    case TYPES.REMOVE_DRAFT_TODO:
      return {
        ...state,
        draftTodos: state.draftTodos.filter((draft) => draft.id !== payload.id),
      };
    case TYPES.SET_BLOCKING_SCHEDULES:
      return {
        ...state,
        blockingSchedules: payload?.blockingSchedules ?? [],
      };
    case TYPES.UPSERT_BLOCKING_SCHEDULE: {
      const incoming = payload?.blockingSchedule;
      if (!incoming?.id) {
        return state;
      }
      const currentBlockingSchedules = Array.isArray(state.blockingSchedules) ? state.blockingSchedules : [];
      const existingBlockingSchedule = currentBlockingSchedules.find((item) => item.id === incoming.id);

      if (!existingBlockingSchedule) {
        // Add new schedule
        return {
          ...state,
          blockingSchedules: [...currentBlockingSchedules, incoming],
        };
      }

      // Update existing schedule
      return {
        ...state,
        blockingSchedules: currentBlockingSchedules.map((item) => (item.id === incoming.id ? incoming : item)),
      };
    }
    case TYPES.REMOVE_BLOCKING_SCHEDULE:
      return {
        ...state,
        blockingSchedules: (state.blockingSchedules || []).filter((item) => item.id !== payload?.id),
      };
    case TYPES.SET_FOCUS_MODE_FINISH_TIME:
      return { ...state, current_focus_mode_finish_time: payload.finishTime };
    case TYPES.SET_HAS_SEEN_PERMISSION_INTRO:
      return { ...state, hasSeenPermissionIntro: true };
    case TYPES.SET_LATE_NO_MORE_EVENTS: {
      const eventIds = new Set((payload.events || []).map((event) => String(event?.id)).filter(Boolean));
      return {
        ...state,
        lateNoMoreEvents: payload.events,
        lateNoMoreDismissedEvents: (state.lateNoMoreDismissedEvents || []).filter((id) => eventIds.has(String(id))),
      };
    }
    case TYPES.LATE_NO_MORE_DISMISS_EVENT: {
      const eventId = payload?.eventId;
      if (eventId == null || eventId === "") {
        return state;
      }
      const prev = state.lateNoMoreDismissedEvents || [];
      if (prev.includes(eventId)) {
        return state;
      }
      return {
        ...state,
        lateNoMoreDismissedEvents: [...prev, eventId],
      };
    }
    case TYPES.SET_LATE_NO_MORE_CONNECTED_PLATFORMS:
      return {
        ...state,
        lateNoMoreConnectedPlatforms: { ...state.lateNoMoreConnectedPlatforms, ...payload.platforms },
      };
    case TYPES.SET_LATE_NO_MORE_NOTIFICATIONS_ENABLED:
      return {
        ...state,
        lateNoMoreNotificationsEnabled: payload.enabled,
      };
    case TYPES.SET_LATE_NO_MORE_REMINDER_TIMES:
      return {
        ...state,
        lateNoMoreReminderTimes: payload.times,
      };
    case TYPES.SET_LATE_NO_MORE_STRICT_MEETING_DETECTION:
      return {
        ...state,
        lateNoMoreRequireMeetingUrl: payload.enabled,
      };
    case TYPES.SET_HAS_DONE_DAILY_MORNING_SESSION:
      return { ...state, hasDoneDailyMorningSession: true };
    case TYPES.SET_HAS_DONE_DAILY_EVENING_SESSION:
      return { ...state, hasDoneDailyEveningSession: true };
    case TYPES.SET_HAS_DONE_DAILY_FOCUS_SESSION:
      return { ...state, hasDoneDailyFocusSession: true };
    case TYPES.SET_HAS_COMPLETED_FOCUS_MODE_FIRST_TIME:
      return { ...state, hasCompletedFocusModeFirstTime: true };
    case TYPES.RESET_DAILY_SESSIONS_DONE:
      return {
        ...state,
        hasDoneDailyMorningSession: false,
        hasDoneDailyEveningSession: false,
        hasDoneDailyFocusSession: false,
        lastResetDate: new Date().toDateString(),
      };
    case TYPES.UPDATE_USER_STREAKS:
      return {
        ...state,
        morning_routines_streak: Math.max(
          state.morning_routines_streak || 0,
          payload.morning_routines_streak ?? state.morning_routines_streak ?? 0,
        ),
        evening_routines_streak: Math.max(
          state.evening_routines_streak || 0,
          payload.evening_routines_streak ?? state.evening_routines_streak ?? 0,
        ),
        focus_modes_streak: Math.max(
          state.focus_modes_streak || 0,
          payload.focus_modes_streak ?? state.focus_modes_streak ?? 0,
        ),

        last_completed_focus_mode_at: payload.last_completed_focus_mode_at ?? state.last_completed_focus_mode_at,
      };
    case TYPES.SET_LAST_RESET_DATE_ONLY:
      return {
        ...state,
        lastResetDate: payload.date,
      };
    case TYPES.INCREMENT_MORNING_STREAK: {
      return {
        ...state,
        morning_routines_streak: (state.morning_routines_streak || 0) + 1,
      };
    }
    case TYPES.INCREMENT_EVENING_STREAK: {
      return {
        ...state,
        evening_routines_streak: (state.evening_routines_streak || 0) + 1,
      };
    }
    case TYPES.INCREMENT_FOCUS_STREAK: {
      return {
        ...state,
        focus_modes_streak: (state.focus_modes_streak || 0) + 1,
      };
    }
    case TYPES.SET_ACTIVITY_AUTOSTART_ENABLED:
      return { ...state, activityAutostartEnabled: payload.enabled };

    default:
      return state;
  }
};

export const privacyPolicyConsentedSelector = (state) => state.user.privacyPolicyConsented;
export const userConsentToPrivacyPolicyLoggedSelector = (state) => state.user.userConsentToPrivacyPolicyLogged;
export const localDeviceSettingsSelector = (state) => state.user.userLocalDeviceSettingsData;
export const appsUsageSelector = (state) => state.user.appsUsage;
export const draftTodosSelector = (state) => state.user?.draftTodos ?? [];
