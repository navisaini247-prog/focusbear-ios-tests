import { QUICK_BREAKS } from "@/constants/quickBreaks";
import { isDateBeforeTodaysRoutineBegan } from "@/utils/TimeMethods";
import { startUpTimeSelector } from "./RoutineSelectors";

export const userSelector = (state) => (Object.keys(state.user).length > 0 ? state.user : null);

// Get the password if there is any password set by the user in the mac app
export const macPasswordSelector = (state) => state.user?.userLocalDeviceSettingsData?.MacOS?.kAppPassword;

// Get the granular settings from mac for when the password is required
export const passwordRequiredForShutDownOrAbortSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInAbortShutoff;

export const passwordRequiredForChangeSettingsSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInChangeSettings;

export const passwordRequiredForQuitAppSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInQuitApp;

export const passwordRequiredForSkipMorningRoutineSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInSkipMorning;

export const passwordRequiredForSkipEveningRoutineSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInSkipEvening;

export const passwordRequiredForSkipAfterCuttOffTimeSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInSkipEveningAfterCutOff;

export const passwordRequiredForStopPomodoroSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInStopPomodoro;

export const previousFocusModeSelector = (state) => state.user?.previousFocusSession;

export const userLocalDeviceSettingsSelector = (state) => state.user?.userLocalDeviceSettingsData;

export const restrictedAppsListTypeSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.Android?.app_restriction_type;

export const bearsonaNameSelector = (state) => state.user?.userLocalDeviceSettingsData?.MacOS?.bearsonaName;

export const userIdSelector = (state) => state.user?.id;

export const userCreatedAtSelector = (state) => state.user?.created_at;

export const userUpdateTimeSelector = (state) => state.user?.updated_at;

export const lastTimeUserSettingsModifiedSelector = (state) => state.user?.last_time_user_settings_modified;

export const lastTimeCurrentActivityPropsFetchedSelector = (state) => state.user?.lastTimeCurrentActivityPropsFetched;

export const isCurrentActivityPropsUpToDateSelector = (state) => {
  const lastTimeFetched = new Date(lastTimeCurrentActivityPropsFetchedSelector(state));
  const startUpTime = startUpTimeSelector(state);
  const isLastFetchAfterTodaysRoutineBegan = !isDateBeforeTodaysRoutineBegan(lastTimeFetched, startUpTime);
  const isNowBeforeTodaysRoutineBegan = isDateBeforeTodaysRoutineBegan(new Date(), startUpTime);
  return isLastFetchAfterTodaysRoutineBegan || isNowBeforeTodaysRoutineBegan;
};

export const currentCompletedActivitiesSelector = (state) =>
  isCurrentActivityPropsUpToDateSelector(state) && state.user?.current_sequence_completed_activities;

export const currentSkippedActivitiesSelector = (state) =>
  isCurrentActivityPropsUpToDateSelector(state) && state.user?.current_sequence_skipped_activities;

export const completingFocusBlockSelector = (state) => state.user?.completing_focus_block;

export const currentFocusModeFinishTimeSelector = (state) => state.user?.current_focus_mode_finish_time;

export const userAccessTokenSelector = (state) => state.user?.accessToken;

export const userLongTermGoalsSelector = (state) => state.user?.long_term_goals;

export const userNicknameSelector = (state) => state.user?.nickname;

export const userEmailSelector = (state) => state.user?.email;

export const emailVerifiedSelector = (state) => state.user?.email_verified;

export const userBlockedUrlsSelector = (state) => state.user?.userLocalDeviceSettingsData?.MacOS?.kArrBlockedUrls;

export const todayRoutineProgressSelector = (state) =>
  isCurrentActivityPropsUpToDateSelector(state) && state.user?.today_routine_progress;

export const isEasySkipEnabledSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.kIsEasySkipEnabled ?? false;

export const blockedAppsSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.Android?.always_blocked_apps ?? [];

export const ignoredAppsSelector = (state) => state.user?.ignoredApps ?? [];

export const userQuickBreaksSelector = (state) => {
  return state.user?.userLocalDeviceSettingsData?.MacOS?.quickBreaks ?? QUICK_BREAKS;
};
export const participantCodeSelector = (state) => state.user?.studyCode;

export const participantCodeEmailSelector = (state) => state.user?.studyCodeEmail;

export const isParticipantCodeLinkedSelector = (state) => state.user?.isParticipantCodeLinked;

export const hasCompletedFlankerSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.hasCompletedFlanker || state.user?.hasCompletedFlanker;

export const hasCompletedQuestionnaireSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.hasCompletedQuestionnaire || state.user?.hasCompletedQuestionnaire;

export const hasCompletedConsentFormSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.hasCompletedConsentForm || state.user?.hasCompletedConsentForm;

export const hasCompletedEoSQuestionnaireSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.hasCompletedEoSQuestionnaire ||
  state.user?.hasCompletedEoSQuestionnaire;

export const hasCompletedAfterStudyFlankerSelector = (state) =>
  state.user?.userLocalDeviceSettingsData?.MacOS?.hasCompletedAfterStudyFlanker ||
  state.user?.hasCompletedAfterStudyFlanker;

export const tasksSelector = (state) => state.user?.tasks ?? [];

export const unfetchedTasksCountsSelector = (state) => state.user?.unfetchedTasksCounts ?? {};

export const hasSeenPermissionIntro = (state) => state.user?.hasSeenPermissionIntro ?? false;

export const isGuestAccountSelector = (state) => state.user?.isGuestAccount ?? false;

export const lateNoMoreEventsSelector = (state) => state.user?.lateNoMoreEvents;

export const lateNoMoreDismissedEventsSelector = (state) => state.user?.lateNoMoreDismissedEvents;

export const lateNoMoreConnectedPlatformsSelector = (state) => state.user?.lateNoMoreConnectedPlatforms;

export const lateNoMoreNotificationsEnabledSelector = (state) => state.user?.lateNoMoreNotificationsEnabled ?? true;

export const lateNoMoreReminderTimesSelector = (state) => state.user?.lateNoMoreReminderTimes;

export const lateNoMoreRequireMeetingUrlSelector = (state) => state.user?.lateNoMoreRequireMeetingUrl ?? false;

export const morningStreakSelector = (state) => state.user?.morning_routines_streak ?? 0;

export const eveningStreakSelector = (state) => state.user?.evening_routines_streak ?? 0;

export const focusStreakSelector = (state) => state.user?.focus_modes_streak ?? 0;

export const hasDoneDailyMorningSessionSelector = (state) => state.user?.hasDoneDailyMorningSession ?? false;

export const hasDoneDailyEveningSessionSelector = (state) => state.user?.hasDoneDailyEveningSession ?? false;

export const hasDoneDailyFocusSessionSelector = (state) => state.user?.hasDoneDailyFocusSession ?? false;

export const hasCompletedFocusModeFirstTimeSelector = (state) => state.user?.hasCompletedFocusModeFirstTime ?? false;

export const lastResetDateSelector = (state) => state.user?.lastResetDate;

export const activityAutostartEnabledSelector = (state) => state.user?.activityAutostartEnabled ?? false;
