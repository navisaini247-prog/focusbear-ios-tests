import { i18n } from "@/localization";
import { APIMethod } from "@/utils/ApiMethod";
import { APIURLS } from "@/utils/ApiUrls";
import { addErrorLog, addInfoLog, logAPIError } from "@/utils/FileLogger";
import {
  AUTH0,
  POSTHOG_EVENT_NAMES,
  SECRET_AUTH0_KEY,
  SERVER_RESPONSE_MESSAGES,
  RESTRICTED_APPS_LIST_TYPE,
  MIME_TYPES,
  PLATFORM_SPECIFIC,
  LOG_ZIP_NAME,
  POSTHOG_PERSON_PROPERTIES,
} from "@/utils/Enums";
import { TASK_STATUS } from "@/utils/toDos";
import { NormalAlert } from "@/utils/GlobalMethods";
import {
  saveAllowedAppsPreference,
  saveBlockedAppsPreference,
  saveRestrictedAppsListTypeToAndroid,
  stopOverlayServiceNativeMethod,
  clearAllBlockingSchedulesNativeMethod,
  updateScheduleBlockingStatus,
} from "@/utils/NativeModuleMethods";
import { Platform } from "react-native";
import { postHogCapture, postHogUnlink, logSentryError, posthogSetProperties } from "@/utils/Posthog";
import notifee from "@notifee/react-native";
import * as Sentry from "@sentry/react-native";
import {
  saveUserLoginTime,
  setNewUserData,
  showSleepMoodAnalyzeModal,
  showSurveyModal,
  setIsOnboardingStatus,
} from "./GlobalActions";
import { routineDataAction } from "./RoutineActions";
import axios from "axios";
import appleAuth from "@invertase/react-native-apple-authentication";
import GoogleCredentialManager, {
  GoogleCredentialManagerStatusCodes,
} from "@/nativeModule/NativeGoogleCredentialManager";
import { PLATFORMS } from "@/constants";
import { platform } from "@/constants/passwordRules";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { debounce } from "lodash";
import DeviceInfo from "react-native-device-info";
import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";
import RNFS from "react-native-fs";
import { v4 as uuidv4 } from "uuid";
import { inferAudioFileExtension } from "@/utils/files";
import { BLANK_HABITS_FOR_FOCUS_ONLY } from "@/constants/activity";
import { disconnectPushNotifications } from "@/utils/PusherMethods";
import { isTestingEnvironment } from "@/utils/Environment";
import { FORGOT_PASSWORD_ERROR_TYPES } from "@/constants/forgotPassword";
import { calculateIsMorningOrEvening } from "@/utils/ActivityRoutineMethods";
import { getSplitDateTime } from "@/utils/TimeMethods";

export const TYPES = {
  CLEAR_STORE: "CLEAR_STORE",
  LOGIN: "LOGIN",
  LOGIN_REQUEST: "LOGIN_REQUEST",
  LOGIN_ERROR: "LOGIN_ERROR",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  SIGNUP: "SIGNUP",
  SIGNUP_REQUEST: "SIGNUP_REQUEST",
  SIGNUP_ERROR: "SIGNUP_ERROR",
  SIGNUP_SUCCESS: "SIGNUP_SUCCESS",
  FULL_ROUTINE_DATA: "FULL_ROUTINE_DATA",
  USER_DETAILS_REQUEST: "USER_DETAILS_REQUEST",
  USER_DETAILS_ERROR: "USER_DETAILS_ERROR",
  USER_DETAILS_SUCCESS: "USER_DETAILS_SUCCESS",
  UPDATE_ACCESS_TOKEN: "UPDATE_ACCESS_TOKEN",
  USER_LOCAL_DEVICE_SETTINGS_SUCCESS: "USER_LOCAL_DEVICE_SETTINGS_SUCCESS",
  ONBOARDING_HABIT_PACK_LIST: "ONBOARDING_HABIT_PACK_LIST",
  ONBOARDING_INSTALL_HABIT_PACK: "ONBOARDING_INSTALL_HABIT_PACK",
  ALLOWED_APPS: "ALLOWED_APPS",
  USER_SUBSCRIPTION_DATA: "USER_SUBSCRIPTION_DATA",
  UPDATE_CURRENT_SEQUENCE_COMPLETED_ACTIVITIES: "UPDATE_CURRENT_SEQUENCE_COMPLETED_ACTIVITIES",
  UPDATE_CURRENT_SEQUENCE_SKIPPED_ACTIVITIES: "UPDATE_CURRENT_SEQUENCE_SKIPPED_ACTIVITIES",
  SET_ROUTINE_STATUS: "SET_ROUTINE_STATUS",
  SET_SPECIFIC_ROUTINE_PROGRESS: "SET_SPECIFIC_ROUTINE_PROGRESS",
  IS_MOTIVATION_MESSAGE_SHOWN: "IS_MOTIVATION_MESSAGE_SHOWN",
  SHARE_LOGS: "SHARE_LOGS",
  SHARE_LOGS_REQUEST: "SHARE_LOGS_REQUEST",
  SHARE_LOGS_SUCCESS: "SHARE_LOGS_SUCCESS",
  SHARE_LOGS_ERROR: "SHARE_LOGS_ERROR",
  USER_DEVICE_DATA_SUCCESS: "USER_DEVICE_DATA_SUCCESS",
  USER_CONSENTED_TO_PRIVACY_POLICY: "USER_CONSENTED_TO_PRIVACY_POLICY",
  LOG_USER_CONSENT_STATUS: "LOG_USER_CONSENT_STATUS",
  CLEAR_PREVIOUS_FOCUS_SESSION: "CLEAR_PREVIOUS_FOCUS_SESSION",
  UPDATE_AUTH_TOKEN: "UPDATE_AUTH_TOKEN",
  UPDATE_USER_NICKNAME: "UPDATE_USER_NICKNAME",
  SET_APPS_USAGE: "SET_APPS_USAGE",
  SET_BLOCKED_APP: "SET_BLOCKED_APP",
  SET_IGNORED_APP: "SET_IGNORED_APP",
  REGISTERED_PARTICIPANT_CODE_EMAIL: "REGISTERED_PARTICIPANT_CODE_EMAIL",
  SET_PARTICIPANT_CODE_LINKED: "SET_PARTICIPANT_CODE_LINKED",
  SET_HAS_COMPLETED_FLANKER: "SET_HAS_COMPLETED_FLANKER",
  SET_HAS_COMPLETED_QUESTIONNAIRE: "SET_HAS_COMPLETED_QUESTIONNAIRE",
  SET_HAS_COMPLETED_EOS_QUESTIONNAIRE: "SET_HAS_COMPLETED_EOS_QUESTIONNAIRE",
  SET_HAS_COMPLETED_CONSENT_FORM: "SET_HAS_COMPLETED_CONSENT_FORM",
  SET_HAS_COMPLETED_AFTER_STUDY_FLANKER: "SET_HAS_COMPLETED_AFTER_STUDY_FLANKER",
  SET_TASKS: "SET_TASKS",
  ADD_TASK: "ADD_TASK",
  UPDATE_TASK: "UPDATE_TASK",
  DELETE_TASK: "DELETE_TASK",
  SET_UNLOADED_COUNT: "SET_UNLOADED_COUNT",
  SET_DRAFT_TODOS: "SET_DRAFT_TODOS",
  ADD_DRAFT_TODO: "ADD_DRAFT_TODO",
  REMOVE_DRAFT_TODO: "REMOVE_DRAFT_TODO",
  SET_BLOCKING_SCHEDULES: "SET_BLOCKING_SCHEDULES",
  UPSERT_BLOCKING_SCHEDULE: "UPSERT_BLOCKING_SCHEDULE",
  REMOVE_BLOCKING_SCHEDULE: "REMOVE_BLOCKING_SCHEDULE",
  SET_FOCUS_MODE_FINISH_TIME: "SET_FOCUS_MODE_FINISH_TIME",
  SET_HAS_SEEN_PERMISSION_INTRO: "SET_HAS_SEEN_PERMISSION_INTRO",
  SET_LATE_NO_MORE_EVENTS: "SET_LATE_NO_MORE_EVENTS",
  LATE_NO_MORE_DISMISS_EVENT: "LATE_NO_MORE_DISMISS_EVENT",
  SET_LATE_NO_MORE_CONNECTED_PLATFORMS: "SET_LATE_NO_MORE_CONNECTED_PLATFORMS",
  SET_LATE_NO_MORE_NOTIFICATIONS_ENABLED: "SET_LATE_NO_MORE_NOTIFICATIONS_ENABLED",
  SET_LATE_NO_MORE_REMINDER_TIMES: "SET_LATE_NO_MORE_REMINDER_TIMES",
  SET_LATE_NO_MORE_STRICT_MEETING_DETECTION: "SET_LATE_NO_MORE_STRICT_MEETING_DETECTION",
  SET_HAS_DONE_DAILY_MORNING_SESSION: "SET_HAS_DONE_DAILY_MORNING_SESSION",
  SET_HAS_DONE_DAILY_EVENING_SESSION: "SET_HAS_DONE_DAILY_EVENING_SESSION",
  SET_HAS_DONE_DAILY_FOCUS_SESSION: "SET_HAS_DONE_DAILY_FOCUS_SESSION",
  SET_HAS_COMPLETED_FOCUS_MODE_FIRST_TIME: "SET_HAS_COMPLETED_FOCUS_MODE_FIRST_TIME",
  RESET_DAILY_SESSIONS_DONE: "RESET_DAILY_SESSIONS_DONE",
  UPDATE_USER_STREAKS: "UPDATE_USER_STREAKS",
  SET_LAST_RESET_DATE_ONLY: "SET_LAST_RESET_DATE_ONLY",
  INCREMENT_MORNING_STREAK: "INCREMENT_MORNING_STREAK",
  INCREMENT_EVENING_STREAK: "INCREMENT_EVENING_STREAK",
  INCREMENT_FOCUS_STREAK: "INCREMENT_FOCUS_STREAK",
  SET_ACTIVITY_AUTOSTART_ENABLED: "SET_ACTIVITY_AUTOSTART_ENABLED",
};

export const setRegisteredParticipantCodeEmail = (email, code) => ({
  type: TYPES.REGISTERED_PARTICIPANT_CODE_EMAIL,
  payload: { email, code },
});

export const setParticipantCodeLinked = (isParticipantCodeLinked) => ({
  type: TYPES.SET_PARTICIPANT_CODE_LINKED,
  payload: { isParticipantCodeLinked },
});

export const setAppsUsage = (appsUsage) => ({
  type: TYPES.SET_APPS_USAGE,
  payload: { appsUsage },
});

export const setBlockedApp = (packageName) => ({
  type: TYPES.SET_BLOCKED_APP,
  payload: { packageName },
});

export const setIgnoredApp = (packageName) => ({
  type: TYPES.SET_IGNORED_APP,
  payload: { packageName },
});

export const updateAuthToken = (data) => ({
  type: TYPES.UPDATE_AUTH_TOKEN,
  payload: { data },
});

export const consentToPrivacyPolicy = () => ({
  type: TYPES.USER_CONSENTED_TO_PRIVACY_POLICY,
});

export const clearPreviousFocusSession = () => ({
  type: TYPES.CLEAR_PREVIOUS_FOCUS_SESSION,
});

export const logUserConsentStatus = () => ({
  type: TYPES.LOG_USER_CONSENT_STATUS,
});

const updateAllowedApps = (allowedApps) => ({
  type: TYPES.ALLOWED_APPS,
  payload: { allowedApps },
});

const loginRequest = () => ({
  type: TYPES.LOGIN_REQUEST,
  payload: null,
});

const loginError = (error) => ({
  type: TYPES.LOGIN_ERROR,
  payload: { error },
});

const loginSuccess = (user) => ({
  type: TYPES.LOGIN_SUCCESS,
  payload: { user },
});

const signupRequest = () => ({
  type: TYPES.SIGNUP_REQUEST,
  payload: null,
});

const signupError = (error) => ({
  type: TYPES.SIGNUP_ERROR,
  payload: { error },
});

const signupSuccess = (user) => ({
  type: TYPES.SIGNUP_SUCCESS,
  payload: { user },
});

const userDetailsRequest = () => ({
  type: TYPES.USER_DETAILS_REQUEST,
  payload: null,
});

const userDetailsError = (error) => ({
  type: TYPES.USER_DETAILS_ERROR,
  payload: { error },
});

const userDetailsSuccess = (userDetails) => ({
  type: TYPES.USER_DETAILS_SUCCESS,
  payload: { userDetails },
});

export const updateMotivationMessageShown = (isMotivationMessageShown) => ({
  type: TYPES.IS_MOTIVATION_MESSAGE_SHOWN,
  payload: { isMotivationMessageShown },
});

export const updateCurrentSequenceCompletedActivities = (data) => ({
  type: TYPES.UPDATE_CURRENT_SEQUENCE_COMPLETED_ACTIVITIES,
  payload: { data },
});

export const updateCurrentSequenceSkippedActivities = (data) => ({
  type: TYPES.UPDATE_CURRENT_SEQUENCE_SKIPPED_ACTIVITIES,
  payload: { data },
});

export const setSpecificRoutineProgress = (routineType, routineProgress) => ({
  type: TYPES.SET_SPECIFIC_ROUTINE_PROGRESS,
  payload: { routineType, routineProgress },
});

const userLocalDeviceSettingsSuccess = (userLocalDeviceSettings) => ({
  type: TYPES.USER_LOCAL_DEVICE_SETTINGS_SUCCESS,
  payload: { userLocalDeviceSettings },
});

const onBoardingHabitPack = (onBoardingHabitPackData) => ({
  type: TYPES.ONBOARDING_HABIT_PACK_LIST,
  payload: { onBoardingHabitPackData },
});

const userSubscriptionData = (userSubscriptionDetails) => ({
  type: TYPES.USER_SUBSCRIPTION_DATA,
  payload: { userSubscriptionDetails },
});

export const storeHabitPack = (installedHabitPackData) => ({
  type: TYPES.ONBOARDING_INSTALL_HABIT_PACK,
  payload: { installedHabitPackData },
});

const shareLogsRequest = () => ({
  type: TYPES.SHARE_LOGS_REQUEST,
  payload: null,
});

const shareLogsSuccess = () => ({
  type: TYPES.SHARE_LOGS_SUCCESS,
  payload: null,
});

const shareLogsError = (error) => ({
  type: TYPES.SHARE_LOGS_ERROR,
  payload: { error },
});

const clearStore = () => ({
  type: TYPES.CLEAR_STORE,
  payload: null,
});

export const userDeviceDataSuccess = (data) => ({
  type: TYPES.USER_DEVICE_DATA_SUCCESS,
  payload: { data },
});

export const saveAllowedApps = (allowedApps) => async (dispatch) => {
  dispatch(updateAllowedApps(allowedApps));
};

const APPLE_AUTH = "apple";
const GOOGLE_AUTH = "google";

export const loginWithDetails =
  (userEmail, password, isNewSignup = false, isGuestAccount = false, callback = undefined) =>
  async (dispatch) => {
    dispatch(loginRequest());

    const doLoginWithDetails = async () => {
      try {
        const credentials = await AUTH0.auth.passwordRealm({
          username: userEmail,
          password,
          realm: "Username-Password-Authentication",
          scope: "openid profile email offline_access",
          audience: "https://auth.focusbear.io/api/v2/",
        });
        credentials.isNewUser = isNewSignup;
        credentials.isGuestAccount = isGuestAccount;

        dispatch(getUserDetailAction(credentials, callback));
        if (credentials.isGuestAccount) {
          postHogCapture(POSTHOG_EVENT_NAMES.SIGNUP_VIA_ANONYMOUSLY_SUCCESS);
        } else if (credentials.isNewUser === true) {
          postHogCapture(POSTHOG_EVENT_NAMES.SIGNUP_VIA_EMAIL_SUCCESS);
        }
      } catch (error) {
        postHogCapture(POSTHOG_EVENT_NAMES.SIGNIN_ERROR, { error: error?.message, type: "email" });
        callback && callback();
        dispatch(loginError(error || i18n.t("common.somethingWrong")));
        if (error?.name === "invalid_grant") {
          NormalAlert({
            message: error?.message || i18n.t("signUp.invalidSignup"),
          });
        } else {
          NormalAlert({
            title: error?.name || "",
            message: error?.message || i18n.t("common.somethingWrong"),
          });
        }
      }
    };
    doLoginWithDetails();
  };

const localizeServerResponse = (strEnglish) => {
  if (strEnglish === SERVER_RESPONSE_MESSAGES.USER_ALREADY_EXISTS) {
    return i18n.t("signUp.userExists");
  }

  //add checks for other server responses in English here

  return strEnglish;
};

export const signup =
  (userEmail, password, isGuestAccount = false, callback) =>
  async (dispatch) => {
    dispatch(signupRequest());
    AUTH0.auth
      .createUser({
        email: userEmail,
        password,
        connection: "Username-Password-Authentication",
      })
      .then(() => {
        dispatch(setNewUserData({ signupTime: new Date() }));
        dispatch(signupSuccess());
        dispatch(loginWithDetails(userEmail, password, true, isGuestAccount, callback));
      })
      .catch((error) => {
        postHogCapture(POSTHOG_EVENT_NAMES.SIGNUP_ERROR, { error: error?.message, type: "email" });
        callback && callback(error);
        dispatch(signupError(error));
        handleAuthError(error, () => dispatch(signup(userEmail, password, callback)));
      });
  };

export const getUserDetailAction =
  (credentials, callback = undefined) =>
  async (dispatch, getState) => {
    if (credentials) {
      AUTH0.auth
        .userInfo({ token: credentials.accessToken })
        .then((profile) => {
          const userData = getState().user;

          "userSubscriptionDetails" in userData
            ? (credentials.userSubscriptionDetails = userData.userSubscriptionDetails)
            : (credentials.userSubscriptionDetails = { hasActiveSubscription: false });

          const user = {
            ...credentials,
            ...profile,
            isGuestAccount: credentials.isGuestAccount || false,
          };

          addInfoLog(`user logged in successfully`);
          dispatch(getUserDetails(credentials.accessToken))
            .then(async (response) => {
              if (credentials.isNewUser) {
                dispatch(syncSignupPlatform());
                postHogCapture(POSTHOG_EVENT_NAMES.SIGNUP);

                if (credentials.authMethod === GOOGLE_AUTH) {
                  postHogCapture(POSTHOG_EVENT_NAMES.SIGNUP_VIA_GOOGLE_SUCCESS);
                } else if (credentials.authMethod === APPLE_AUTH) {
                  postHogCapture(POSTHOG_EVENT_NAMES.SIGNUP_VIA_APPLE_SUCCESS);
                }

                const globalState = getState().global;
                if (globalState?.isFocusOnlyGoalSelected) {
                  dispatch(setIsOnboardingStatus(true));
                  try {
                    await dispatch(putUserSettings(BLANK_HABITS_FOR_FOCUS_ONLY, true));
                    dispatch(storeHabitPack(BLANK_HABITS_FOR_FOCUS_ONLY));
                    addInfoLog("Installed blank habits for focus-only user after signup");
                  } catch (error) {
                    logAPIError("Error installing blank habits after signup:", error);
                  }
                }
                const userId = response?.id || getState()?.user?.id;
                if (userId) {
                  posthogSetProperties(userId, {
                    [POSTHOG_PERSON_PROPERTIES.INTERNAL_TEST_USER]: isTestingEnvironment(),
                  });
                }
              } else {
                dispatch(
                  setIsOnboardingStatus(
                    response?.onboarding_progress?.has_edited_settings || response?.has_edited_settings,
                  ),
                );
                postHogCapture(POSTHOG_EVENT_NAMES.LOGIN);
              }
            })
            .finally(() => {
              dispatch(loginSuccess(user));
              callback && callback();
            });
          // To show Reporting/Survey flow based on user login time (CSat + Impact Reporting)
          const loginTime = new Date();
          dispatch(saveUserLoginTime(loginTime));
          dispatch(showSleepMoodAnalyzeModal(true));
          dispatch(showSurveyModal(true));
        })
        .catch((error) => {
          dispatch(loginError(error || i18n.t("common.somethingWrong")));
        });
    }
  };

export const getUserLocalDeviceSettings = () => async (dispatch, getState) => {
  APIMethod({ endpoint: APIURLS.userLocalDeviceSettings, method: "GET" })
    .then((response) => {
      addInfoLog("userLocalDeviceSettings fetched");

      // Get allowed apps array and send it to native android bridge so that it will not be blocked
      let allowedApps = response?.data?.Android?.always_allowed_apps ?? [];

      //change allowedApps to contain strings if it currently contains objects
      if (allowedApps.length > 0 && typeof allowedApps[0] !== "string") {
        allowedApps = allowedApps.map((allowedAppsObj) => allowedAppsObj.value);
      }

      saveAllowedAppsPreference(allowedApps);

      // Get blocked apps array and send it to native android bridge so that it will be blocked
      const blockedApps = response?.data?.Android?.always_blocked_apps ?? [];
      saveBlockedAppsPreference(blockedApps);

      // Set Blocking Type Mode to native android
      const appRestrictionType = response?.data?.Android?.app_restriction_type ?? RESTRICTED_APPS_LIST_TYPE.BLOCK_LIST;
      saveRestrictedAppsListTypeToAndroid(appRestrictionType);

      addInfoLog(`GET data from API : user-local-device-settings`);
      dispatch(userLocalDeviceSettingsSuccess(response?.data));
    })
    .catch((error) => {
      logAPIError("userLocalDeviceSettings Error ==>", error);
    });
};

export const getDefaultHabitPacks = () => async (dispatch, getState) => {
  APIMethod({ endpoint: APIURLS.defaultHabitPackList, method: "GET" })
    .then((response) => {
      addInfoLog("getDefaultHabitPack response ==>");
      dispatch(onBoardingHabitPack(response?.data));
    })
    .catch((error) => {
      logAPIError("getDefaultHabitPack Error ==>", error);
    });
};

export const getUserSubscription = () => async (dispatch, getState) => {
  APIMethod({ endpoint: APIURLS.userSubscription, method: "GET" })
    .then((response) => {
      addInfoLog("getUserSubscription response ==>");
      dispatch(userSubscriptionData(response?.data));
    })
    .catch((error) => {
      logAPIError("getUserSubscription Error ==>", error);
    });
};

export const deleteAccountData = (canContact, message) => async (dispatch, getState) => {
  addInfoLog("deleteAccountData called, message ==>", message, "canContact ==>", canContact);

  const queryParams = new URLSearchParams({ can_contact: canContact, message }).toString();
  const urlWithParams = `${APIURLS.userData}?${queryParams}`;

  return APIMethod({
    endpoint: urlWithParams,
    method: "DELETE",
  })
    .then((response) => {
      postHogCapture(POSTHOG_EVENT_NAMES.DELETE_USER_ACCOUNT, { canContact, message });
      addInfoLog("deleteAccountData response ==>", response);
      dispatch(logout());
      saveAllowedAppsPreference([]);
      saveBlockedAppsPreference([]);
      NormalAlert({
        message: i18n.t("home.accountDataHasBeen"),
        singleButton: true,
      });
      return response;
    })
    .catch((error) => {
      logAPIError("deleteAccountData Error ==>", error);
      throw error;
    });
};

export const installDefaultHabitPack = (pack_id) => async (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    APIMethod({ endpoint: APIURLS.installDefaultHabitPack(pack_id), method: "GET" })
      .then((response) => {
        addInfoLog("installDefaultHabitPack response successfull");
        dispatch(storeHabitPack(response?.data));
        resolve(response?.data);
      })
      .catch((error) => {
        logAPIError("installDefaultHabitPack failed  ==>", error);
        reject(error);
      });
  });
};

export const installHabitPack = (pack_id) => async (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    APIMethod({ endpoint: APIURLS.installHabitPack(pack_id), method: "POST" })
      .then((response) => {
        addInfoLog("installHabitPack response successfull");
        dispatch(storeHabitPack(response?.data));
        resolve(response?.data);
      })
      .catch((error) => {
        logAPIError("installHabitPack failed  ==>", error);
        reject(error);
      });
  });
};

export const getInstalledHabitPack = () => async (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    APIMethod({ endpoint: APIURLS.userInstalledHabitPacks, method: "GET" })
      .then((response) => {
        addInfoLog("user installed HabitPack response successfull");
        resolve(response?.data);
      })
      .catch((error) => {
        logAPIError("user installed HabitPack failed  ==>", error);
        reject(error);
      });
  });
};

export const postUserLocalDeviceSettings =
  (changedProperties, platformName, callback) => async (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      let params;
      if (platformName === PLATFORMS.CURRENT_PLATFORM_COMBINED_WITH_MACOS) {
        const platform = checkIsAndroid() ? PLATFORMS.ANDROID : PLATFORMS.IOS;
        const currentPlatfromDeviceSettings = getState().user?.userLocalDeviceSettingsData[platform];
        const macOsSettings = getState().user?.userLocalDeviceSettingsData[PLATFORMS.MACOS];
        params = {
          [platform]: { ...currentPlatfromDeviceSettings, ...changedProperties[platform] },
          [PLATFORMS.MACOS]: { ...macOsSettings, ...changedProperties[PLATFORMS.MACOS] },
        };
      } else {
        const platform = platformName ?? (checkIsAndroid() ? PLATFORMS.ANDROID : PLATFORMS.IOS);
        let currentPlatfromDeviceSettings;
        if (getState().user?.userLocalDeviceSettingsData) {
          currentPlatfromDeviceSettings = getState().user?.userLocalDeviceSettingsData[platform];
        }
        params = {
          [platform]: { ...currentPlatfromDeviceSettings, ...changedProperties },
        };
      }
      APIMethod({
        endpoint: APIURLS.userLocalDeviceSettings,
        method: "PUT",
        body: params,
      })
        .then((response) => {
          addInfoLog("post allowedapps to api ");
          addInfoLog(`PUT data to API : user-local-device-settings`);
          dispatch(userLocalDeviceSettingsSuccess(response?.data));
          dispatch(getUserLocalDeviceSettings());
          resolve(response?.data);
          callback && callback(true);
        })
        .catch((error) => {
          logAPIError("post allowedapps to api Error ==>", error);
          reject(error);
          callback && callback();
        });
    });
  };

const debouncedGetCurrentActivityProps = debounce(
  async (dispatch, getState) => {
    try {
      const response = await APIMethod({ endpoint: APIURLS.userCurrentActivityProps, method: "GET" });
      addInfoLog(`GET Data from API : user/details/current-activity-props`);
      debugLogsForCurrentActivityProps(response?.data, getState()?.routine?.fullRoutineData);

      dispatch(userDetailsSuccess({ ...response?.data, lastTimeCurrentActivityPropsFetched: Date.now() }));
      return response?.data;
    } catch (error) {
      logAPIError("current-activity-props error -->", error);
      throw new Error(error);
    }
  },
  500,
  { leading: true, trailing: false }, // debounce with only leading call
);

export const getCurrentActivityProps = () => debouncedGetCurrentActivityProps;

const debugLogsForCurrentActivityProps = (currentActivityProps, fullRoutineData) => {
  const { startup_time, shutdown_time, cutoff_time_for_non_high_priority_activities } = fullRoutineData || {};
  const { morning_activities, evening_activities } = fullRoutineData || {};
  const { today_routine_progress, current_activity_sequence, current_sequence_completed_activities } =
    currentActivityProps || {};

  const morningRoutineStatus = today_routine_progress?.morning_routine?.status || "none";
  const eveningRoutineStatus = today_routine_progress?.evening_routine?.status || "none";
  const [startupTime, shutdownTime] = [getSplitDateTime(startup_time), getSplitDateTime(shutdown_time)];
  const currentRoutineCalculated = calculateIsMorningOrEvening(startupTime, shutdownTime).toLowerCase();
  const currentRoutineAPI = current_activity_sequence?.type || "none";

  addInfoLog(
    `current-activity-props debug => startup: ${startup_time}, shutdown: ${shutdown_time}, cutoff: ${cutoff_time_for_non_high_priority_activities}\n`,
    `morning-routine => activities.length: ${morning_activities?.length}, today_routine_progress.status: ${morningRoutineStatus}\n`,
    `evening-routine => activities.length: ${evening_activities?.length}, today_routine_progress.status: ${eveningRoutineStatus}\n`,
    `current-routine => calculated: ${currentRoutineCalculated}, current_activity_sequence.type: ${currentRoutineAPI}, current_sequence_completed_activities.length: ${current_sequence_completed_activities?.length}`,
  );
};

export const getUserDetails = (bearerToken) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    APIMethod({ endpoint: APIURLS.userDetails, method: "GET", bearerToken })
      .then((response) => {
        addInfoLog(`GET Data from API : user/details`);
        dispatch(userDetailsSuccess(response?.data));
        resolve(response?.data);
      })
      .catch((error) => {
        // Handles Auth0 specific error cases
        logAPIError("getUserDetails error -->", error);
        addInfoLog(`GET Data from API Error : user/details`);
        const exception = new Error(error);
        logSentryError(exception);
        reject(error);
      });
  });
};

export const updateDeviceDataApiAction = () => async (dispatch, getState) => {
  const body = {
    operating_system: platform,
  };
  APIMethod({
    endpoint: APIURLS.device,
    method: "POST",
    body,
  })
    .then((response) => {
      addInfoLog(`Get device id from API`);
      dispatch(userDeviceDataSuccess(response?.data));
    })
    .catch((error) => {
      logAPIError("Device API Error", error);
    });
};

export const forgotPasswordAction = (emailAddress) => async (dispatch, getState) => {
  const body = {
    email: emailAddress,
  };

  try {
    await APIMethod({
      endpoint: APIURLS.forgotPassword,
      method: "POST",
      noToken: true,
      enableErrorMessage: false,
      body,
    });

    addInfoLog("forgotPasswordAction Success: Reset link sent");
    return { success: true };
  } catch (error) {
    const status = error?.response?.status;

    /*
    NOTE: The status code numbers below are based on how the api focusbear responses from auth/reset-password were configurated
    */

    // User created an account with a third party service (google or apple etc.)
    if (status === 400) {
      logAPIError("Forgot Password OAuth Account (400):", error);
      const err = new Error("Account uses third party service");
      err.type = FORGOT_PASSWORD_ERROR_TYPES.OAUTH_ACCOUNT_THIRD_PARTY;
      throw err;
    }

    // User has an unverified email
    if (status === 403) {
      logAPIError("Forgot Password Unverified Email (403):", error);
      const err = new Error("Email not verified");
      err.type = FORGOT_PASSWORD_ERROR_TYPES.UNVERIFIED_EMAIL;
      throw err;
    }

    // In this context, if we get a 404 error, the requested resource doesnt exist -> email not found
    if (status === 404) {
      logAPIError("Forgot Password Not Found (404):", error);
      const err = new Error("Requested Resource Does Not Exist");
      err.type = FORGOT_PASSWORD_ERROR_TYPES.EMAIL_DOES_NOT_EXIST;
      throw err;
    }

    logAPIError(`Forgot Password Error (${status}):`, error);
    const err = new Error("Password reset failed");
    err.type = FORGOT_PASSWORD_ERROR_TYPES.RESET_PASSWORD_FAILED;
    throw err;
  }
};

export const putUserSettings =
  (settings, isOnboarding = false) =>
  async (dispatch) => {
    try {
      addInfoLog("POST ===> updateUserSettings");
      dispatch(routineDataAction(settings));
      return await APIMethod({
        endpoint: `${APIURLS.updateUserSettings}${isOnboarding ? "?is_onboarding=true" : ""}`,
        method: "PUT",
        body: settings,
      });
    } catch (error) {
      logAPIError("putUserSettings Error ==>", error);
      return Promise.reject(error);
    }
  };

export const logout = () => async (dispatch) => {
  addInfoLog("User start logging out!");
  await disconnectPushNotifications();
  stopOverlayServiceNativeMethod();
  try {
    await clearAllBlockingSchedulesNativeMethod();
    await updateScheduleBlockingStatus();
    addInfoLog("Cleared all blocking schedules on logout");
  } catch (error) {
    logAPIError("Failed to clear blocking schedules on logout", error);
  }
  postHogCapture(POSTHOG_EVENT_NAMES.LOGOUT);
  postHogUnlink();
  await notifee.cancelAllNotifications();

  try {
    AUTH0.webAuth
      .clearSession({})
      .then((success) => {
        addInfoLog("User Logged out!", success);
      })
      .catch((error) => {
        logAPIError("check logout error", error);
      });
  } finally {
    dispatch(clearStore());
    dispatch(updateMotivationMessageShown(false));
    addInfoLog(`User logged out Successfully`);
  }
};

// Google OAuth Web Client ID for Credential Manager
const GOOGLE_WEB_CLIENT_ID = "855125705871-4llqq1r5fgq6n7rqji8jvrdul5hgvf26.apps.googleusercontent.com";

/**
 * Perform native Google Sign-In using Android Credential Manager
 * This generates and includes a nonce for token replay protection
 * @see https://developer.android.com/identity/sign-in/credential-manager-siwg
 */
const performNativeGoogleSignIn = async () => {
  if (!GoogleCredentialManager) {
    throw new Error("GoogleCredentialManager is not available");
  }

  // Sign in with Credential Manager - includes nonce generation
  const result = await GoogleCredentialManager.signIn(GOOGLE_WEB_CLIENT_ID, true);

  return {
    idToken: result.idToken,
    nonce: result.nonce,
    user: {
      id: result.id,
      name: result.displayName,
      familyName: result.familyName,
      givenName: result.givenName,
      photo: result.profilePictureUri,
    },
  };
};

/**
 * Exchange Google ID token with Auth0 using native social login
 * @see https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/google-native
 */
const exchangeGoogleTokenWithAuth0 = async (idToken) => {
  try {
    // Use Auth0 SDK's exchangeNativeSocial method
    // The nonce is embedded in the ID token from Credential Manager
    const auth0Response = await AUTH0.auth.exchangeNativeSocial({
      subjectToken: idToken,
      subjectTokenType: "http://auth0.com/oauth/token-type/google-id-token",
      scope: "openid profile email offline_access",
      audience: "https://auth.focusbear.io/api/v2/",
    });

    // Auth0 SDK returns camelCase, maintain compatibility with existing code
    return {
      ...auth0Response,
      refreshToken: auth0Response.refreshToken || auth0Response.refresh_token,
      accessToken: auth0Response.accessToken || auth0Response.access_token,
    };
  } catch (error) {
    // Auth0 SDK throws AuthError which has: name, message, status, json
    const errorMessage =
      error?.json?.error_description || error?.message || "Failed to exchange Google token with Auth0";
    const enhancedError = new Error(errorMessage);
    enhancedError.status = error?.status;
    enhancedError.responseData = {
      error: error?.json?.error || error?.name,
      error_description: error?.json?.error_description || error?.message,
    };
    logAPIError("Google token exchange error", error);
    throw enhancedError;
  }
};

export const continueWithGoogle =
  (isSigningUp = false, callback) =>
  async (dispatch) => {
    try {
      dispatch(loginRequest());

      let credentials;

      if (checkIsAndroid() && GoogleCredentialManager) {
        // Android: Use native Credential Manager with nonce support
        // See: https://developer.android.com/identity/sign-in/credential-manager-siwg
        const googleResult = await performNativeGoogleSignIn();
        credentials = await exchangeGoogleTokenWithAuth0(googleResult.idToken);
      } else {
        // iOS: Use Auth0 WebAuth (no native Credential Manager)
        credentials = await AUTH0.webAuth.authorize({
          connection: "google-oauth2",
          scope: "openid profile email offline_access",
          audience: "https://auth.focusbear.io/api/v2/",
          prompt: "login",
        });
      }

      credentials.authMethod = GOOGLE_AUTH;
      credentials.isNewUser = isSigningUp;

      if (isSigningUp) {
        dispatch(setNewUserData({ signupTime: new Date(), isNewUser: true }));
      }

      dispatch(getUserDetailAction(credentials));
    } catch (error) {
      const isUserCancelled =
        error?.error === "a0.session.user_cancelled" ||
        error?.error_description === "User cancelled the Auth" ||
        error?.code === GoogleCredentialManagerStatusCodes.SIGN_IN_CANCELLED;

      if (!isUserCancelled) {
        postHogCapture(POSTHOG_EVENT_NAMES.SIGNIN_ERROR, { error: error?.message, type: "google" });
      }

      dispatch(loginError(error));

      if (error?.name === "invalid_grant") {
        NormalAlert({
          message: error?.error_description || i18n.t("signUp.invalidSignup"),
        });
      } else if (isUserCancelled) {
        return;
      } else {
        NormalAlert({
          title: error?.name || "",
          message: error?.error_description || error?.message || i18n.t("common.somethingWrong"),
        });
      }
    } finally {
      callback && callback();
    }
  };

export const loginWithApple = (callback) => async (dispatch) => {
  try {
    dispatch(loginRequest());
    const appleAuthRequestResponse = await appleAuth.performRequest({
      nonceEnabled: false,
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

    if (credentialState === appleAuth.State.AUTHORIZED) {
      const { fullName, authorizationCode, email } = appleAuthRequestResponse,
        { familyName, givenName } = fullName;

      const _auth0Response = await axios({
        url: `https://${SECRET_AUTH0_KEY.DOMAIN}/oauth/token`,
        method: "POST",
        data: {
          grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
          subject_token_type: "http://auth0.com/oauth/token-type/apple-authz-code",
          scope: "read:appointments openid profile email email_verified offline_access",
          audience: "https://auth.focusbear.io/api/v2/",
          subject_token: authorizationCode,
          client_id: SECRET_AUTH0_KEY.CLIENT_ID,
          user_profile: JSON.stringify({
            name: {
              firstName: givenName,
              lastName: familyName,
            },
            email: email,
          }),
        },
      });
      dispatch(
        getUserDetailAction({
          ..._auth0Response.data,
          refreshToken: _auth0Response.data.refresh_token,
          accessToken: _auth0Response.data.access_token,
          authMethod: APPLE_AUTH,
        }),
      );
    }
  } catch (error) {
    const isUserCancelled =
      error?.message?.includes("com.apple.AuthenticationServices.AuthorizationError error 1000") ||
      error?.code === 1000;

    if (!isUserCancelled) {
      postHogCapture(POSTHOG_EVENT_NAMES.SIGNIN_ERROR, { error: error?.message, type: "apple" });
    }

    dispatch(loginError(error || i18n.t("common.somethingWrong")));
  } finally {
    callback && callback();
  }
};

export const fetchVideoMetadata = async (videoUrls) => {
  try {
    addInfoLog(`Fetching video metadata for ${videoUrls.length} videos ==>`);

    const response = await APIMethod({
      endpoint: APIURLS.videoMetadata,
      method: "POST",
      body: { video_urls: videoUrls },
      enableErrorMessage: false,
    });

    addInfoLog(`Video metadata response received ==>`);

    const videosMetadata = response?.data?.videos_metadata;

    // Validate response structure
    if (!videosMetadata || !Array.isArray(videosMetadata) || videosMetadata.length === 0) {
      addErrorLog("Video metadata returned nothing. Invalid video url?");
      return {};
    }

    const firstVideo = videosMetadata[0];
    const { id, title, duration } = firstVideo;

    // Return formatted object with thumbnail URL included
    const thumbnailUrl = `https://img.youtube.com/vi/${id}/0.jpg`;
    return { id, title, duration, thumbnailUrl };
  } catch (error) {
    logAPIError("fetchVideoMetadata error ==>", error);
    return Promise.reject(error);
  }
};

export const getAppLogsUploadUrl = () => async (dispatch) => {
  try {
    // 1. Get upload URL
    const response = await APIMethod({
      endpoint: APIURLS.appLogsGetUploadUrl(LOG_ZIP_NAME, MIME_TYPES.ZIP),
      method: "GET",
    });

    addInfoLog("appLogsGetUploadUrl response ==>");
    const uploadUrl = response?.data;
    if (!uploadUrl || typeof uploadUrl !== "string") {
      throw new Error("Upload logs URL invalid");
    }
    return uploadUrl;
  } catch (error) {
    logAPIError("appLogsGetUploadUrl Error ==> ", error);
    Sentry.captureException(new Error(error));
    return Promise.reject(error);
  }
};

export const uploadAppLogs =
  ({ uploadUrl, zipPath, feedbackMsg }) =>
  async (dispatch) => {
    try {
      // 2. Read file as base64
      const fileData = await RNFS.readFile(PLATFORM_SPECIFIC.GET_FULL_PATH(zipPath), "base64");
      const fileBuffer = Buffer.from(fileData, "base64");

      // 3. Upload file
      await axios.put(uploadUrl, fileBuffer, {
        headers: {
          "Content-Type": "application/zip",
        },
      });
      addInfoLog("uploadAppLogs direct to R2 response ==>");

      // 4. Notify upload success
      await APIMethod({
        endpoint: APIURLS.appLogsNotifyUploadSuccess,
        method: "POST",
        body: {
          uploaded_file_url: uploadUrl,
          feedback_message: feedbackMsg,
          app_platform: platform,
          app_version: `${DeviceInfo.getVersion()} ${DeviceInfo.getBuildNumber()}`,
        },
      });
      addInfoLog("appLogsNotifyUploadSuccess response ==>");
    } catch (error) {
      logAPIError("upload app log API Error ==> ", error);
      Sentry.captureException(new Error(error));
      return Promise.reject(error);
    }
  };

export const updateUserConsentStatus = () => async (dispatch, getState) => {
  APIMethod({
    endpoint: APIURLS.userConsent,
    method: "PUT",
    body: {
      consent_type: "terms_of_service",
      consent_status: true,
      metadata: {
        policy_version: "1.0.0",
      },
    },
  })
    .then(() => {
      dispatch(logUserConsentStatus());
      addInfoLog("updateUserConsentStatus");
    })
    .catch((error) => {
      logAPIError("updateUserConsentStatus api Error ==>", error);
    });
};

export const getUserLongTermGoals = () => async (dispatch, getState) => {
  APIMethod({
    endpoint: APIURLS.longTermGoals,
    method: "GET",
  })
    .then((response) => {
      dispatch(
        userDetailsSuccess({
          long_term_goals: response.data,
        }),
      );
    })
    .catch((error) => {
      const exception = new Error(error);
      Sentry.captureException(exception);
    });
};

export const syncSignupPlatform = () => async (dispatch, getState) => {
  const body = {
    platform: Platform.OS,
  };
  APIMethod({
    endpoint: APIURLS.syncSignupUserPlatform,
    method: "POST",
    body: body,
  })
    .then((response) => {
      addInfoLog("New user platform sync successful");
    })
    .catch((error) => {
      logAPIError("New user platform sync failed", error);
      const exception = new Error(error);
      Sentry.captureException(exception);
    });
};

// In some screens (i.e. ForgotPassword) There is No Access Token. Thus, tell API method to not look for access token.
export const sendEmailConfirmation =
  ({ email, lang, noToken }) =>
  async (dispatch, getState) => {
    APIMethod({
      endpoint: APIURLS.sendEmailVerification,
      method: "POST",
      noToken: noToken,
      body: { email, lang },
    })
      .then((response) => {
        addInfoLog("sendEmailConfirmation Successful");
      })
      .catch((error) => {
        const status = error?.response?.status;
        logAPIError(`sendEmailConfirmation Error (${status}):`, error);
      });
  };

export const updateUserNickname = (nickname) => async (dispatch, getState) => {
  try {
    await APIMethod({
      endpoint: APIURLS.updateUsername,
      method: "PUT",
      body: { username: nickname },
      enableErrorMessage: false,
    });

    addInfoLog("updateUsername response ==>");

    dispatch({
      type: TYPES.UPDATE_USER_NICKNAME,
      payload: { nickname },
    });
  } catch (error) {
    logAPIError("updateUserNickname error ==>", error);
    throw error;
  }
};

export const registerParticipant = async (details) => {
  const params = {
    email: details.email,
    name: details.name,
    metadata: {
      faculty: details.faculty,
      yearLevel: details.yearLevel,
      mobileOS: Platform.OS,
    },
    whatsappConsent: !details.whatsappConsent,
    lang: details.lang,
    phoneNumber: details.phoneNumber,
  };

  return APIMethod({
    endpoint: APIURLS.studyParticipants.addParticipantDetails,
    method: "POST",
    body: params,
    noToken: true,
    bearerToken: "",
    enableErrorMessage: false,
  });
};

export const verifyParticipantCode = async (code) => {
  const response = await APIMethod({
    noToken: true,
    bearerToken: "",
    endpoint: APIURLS.studyParticipants.verifyParticipantCode,
    method: "POST",
    body: {
      participantCode: code,
    },
    enableErrorMessage: false,
  });

  return response.data;
};

export const linkUserToParticipantCode = async (code) => {
  return APIMethod({
    endpoint: APIURLS.studyParticipants.linkUserToParticipantCode,
    method: "POST",
    body: {
      participantCode: code,
    },
    enableErrorMessage: false,
  });
};

export const getParticipantCodeActivationStatus = async (participantCode) => {
  try {
    const response = await APIMethod({
      body: undefined,
      endpoint: APIURLS.studyParticipants.getCodeActivationStatus(participantCode),
      method: "GET",
      enableErrorMessage: false,
    });

    return response.data;
  } catch (error) {
    return null;
  }
};

export const syncUsageStats = async (usageData) => {
  return APIMethod({
    endpoint: APIURLS.usageDataSync,
    method: "POST",
    body: {
      usageData: usageData,
    },
  });
};

export const syncHealthData = async (healthData) => {
  return APIMethod({
    endpoint: APIURLS.healthDataSync,
    method: "POST",
    body: {
      healthMetrics: healthData,
    },
  });
};

export const generateUploadImageUrl = async () => {
  const response = await APIMethod({
    endpoint: APIURLS.generateUploadImageUrl,
    method: "POST",
  });
  return response.data;
};

export const processUploadedImage = async (params) => {
  return APIMethod({
    endpoint: APIURLS.processUploadedImage,
    method: "POST",
    body: params,
  });
};

export const generateTodoUploadImageUrl = async () => {
  const response = await APIMethod({
    endpoint: APIURLS.generateTodoUploadImageUrl,
    method: "POST",
  });
  return response.data;
};

export const todoImageUploaded = async (params) => {
  return APIMethod({
    endpoint: APIURLS.todoImageUploaded,
    method: "POST",
    body: params,
  });
};

export const getStatsLastSyncedDate = async () => {
  return APIMethod({
    endpoint: APIURLS.studyParticipants.getParticipantLastReceivedData,
    method: "GET",
    enableErrorMessage: false,
  });
};

export const setHasCompletedFlanker = (hasCompleted) => ({
  type: TYPES.SET_HAS_COMPLETED_FLANKER,
  payload: { hasCompleted },
});

export const setHasCompletedAfterStudyFlanker = (hasCompleted) => ({
  type: TYPES.SET_HAS_COMPLETED_AFTER_STUDY_FLANKER,
  payload: { hasCompleted },
});

export const setHasCompletedQuestionnaire = (hasCompleted) => ({
  type: TYPES.SET_HAS_COMPLETED_QUESTIONNAIRE,
  payload: { hasCompleted },
});

export const markCompleteQuestionnaire = async () => {
  return APIMethod({
    endpoint: APIURLS.studyParticipants.markCompleteQuestionnaire,
    method: "POST",
    enableErrorMessage: false,
  });
};

export const saveFlankerTestResult = async (result) => {
  return APIMethod({
    endpoint: APIURLS.studyParticipants.saveFlankerTestResult,
    method: "POST",
    body: result,
  });
};

export const markCompleteEoSQuestionnaire = async () => {
  return APIMethod({
    endpoint: APIURLS.studyParticipants.markCompleteEoSQuestionnaire,
    method: "POST",
    enableErrorMessage: false,
  });
};

export const setHasCompletedEoSQuestionnaire = (hasCompleted) => ({
  type: TYPES.SET_HAS_COMPLETED_EOS_QUESTIONNAIRE,
  payload: { hasCompleted },
});

export const setHasCompletedConsentForm = (hasCompleted) => ({
  type: TYPES.SET_HAS_COMPLETED_CONSENT_FORM,
  payload: { hasCompleted },
});

export const getTaskStatus = async (taskId) => {
  return APIMethod({
    endpoint: APIURLS.getTaskStatus(taskId),
    method: "GET",
    enableErrorMessage: false,
  });
};

export const setTasks = (tasks) => ({
  type: TYPES.SET_TASKS,
  payload: { tasks },
});

export const fetchTasks = ({ page = 1, take = 10, order = "DESC", status = TASK_STATUS.NOT_STARTED }) => {
  return async (dispatch, getState) => {
    addInfoLog(`fetchTasks ${status} (page ${page}) ==>`);

    const response = await APIMethod({
      endpoint: APIURLS.toDo,
      method: "GET",
      params: { page, take, status, order },
    });

    addInfoLog(`fetchTasks ${status} (page ${page}) response ==>`);

    const newTasks = response.data.data;

    const newTaskIds = new Set(newTasks.map((task) => task.id));
    const savedTasks = getState()?.user?.tasks || [];
    const dedupedSavedTasks = savedTasks.filter((task) => !newTaskIds.has(task.id));
    const tasksOfOtherStatus = dedupedSavedTasks.filter((task) => task.status !== status);

    let totalFetchedCount = 0;
    if (page === 1) {
      // discard previously fetched tasks of same status
      dispatch(setTasks([...tasksOfOtherStatus, ...newTasks]));
      totalFetchedCount = newTasks.length;
    } else {
      const tasksOfSameStatus = dedupedSavedTasks.filter((task) => task.status === status);
      dispatch(setTasks([...tasksOfOtherStatus, ...tasksOfSameStatus, ...newTasks]));
      totalFetchedCount = tasksOfSameStatus.length + newTasks.length;
    }

    const serverCount = response?.data?.meta?.itemCount || 0;
    const unfetchedCount = serverCount - totalFetchedCount;
    dispatch(setUnfetchedTasksCount(status, unfetchedCount));

    // meta = { page, take, itemCount, pageCount, hasPreviousPage, hasNextPage }
    return response?.data?.meta;
  };
};

export const searchTasks =
  ({ title }) =>
  async (dispatch, getState) => {
    const response = await APIMethod({
      endpoint: APIURLS.toDoSearch,
      method: "GET",
      params: { title },
    });

    const newTasks = response.data;

    const savedTasks = getState()?.user?.tasks || [];
    const savedTaskIds = new Set(savedTasks.map((task) => task.id));
    const dedupedNewTasks = newTasks.filter((task) => !savedTaskIds.has(task.id));
    dispatch(setTasks([...savedTasks, ...dedupedNewTasks]));

    const results = newTasks.map((task) => task.id);
    return results;
  };

export const addTask = (task) => async (dispatch) => {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const defaultTitle = "Untitled Task";

  task = {
    id: uuidv4(),
    title: defaultTitle,
    status: TASK_STATUS.NOT_STARTED,
    due_date: today,
    created_at: new Date(),
    eisenhower_quadrant: 4,
    ...task,
  };

  dispatch({
    type: TYPES.ADD_TASK,
    payload: { task },
  });

  try {
    await APIMethod({
      endpoint: APIURLS.toDo,
      method: "PUT",
      body: task,
    });
  } catch (error) {
    logAPIError("addTask error ==>", error);
    throw error;
  }
};

// Audio upload flow: request presigned URL, upload file, then notify backend
export const generateTodoUploadAudioUrl = async ({ fileExtension = "mp3" } = {}) => {
  const response = await APIMethod({
    endpoint: APIURLS.generateTodoUploadAudioUrl,
    method: "POST",
    body: { fileExtension },
  });
  return response.data;
};

export const todoAudioUploaded = async ({ audioKey }) => {
  return APIMethod({
    endpoint: APIURLS.todoAudioUploaded,
    method: "POST",
    body: { audioKey },
  });
};

export const handleAuthError = (error, onRetry) => {
  if (error?.name === "a0.response.invalid") {
    // Track analytics event
    postHogCapture(POSTHOG_EVENT_NAMES.AUTHENTICATION_ERROR);

    // Localize error text
    const title = i18n.t("error.authenticationErrorName");
    const message = i18n.t("error.authenticationErrorMessage");

    // Display retry dialog
    NormalAlert({
      title,
      message,
      yesText: i18n.t("common.retry"),
      cancelText: i18n.t("common.cancel"),
      singleButton: false,
      onPressYesButton: onRetry,
    });
  } else if (error?.name === "PasswordStrengthError") {
    NormalAlert({ message: i18n.t("signUp.passwordHintError") });
  } else if (error?.name === "BadRequestError") {
    error?.message && (error.message = localizeServerResponse(error.message));
    NormalAlert({
      message: error?.message || i18n.t("signUp.invalidSignup"),
    });
  } else {
    NormalAlert({
      title: error?.name || "",
      message: error?.message || i18n.t("common.somethingWrong"),
    });
  }
};

// End-to-end audio upload using fetch + Blob (aligned with OCR image upload flow)
export const uploadTodoAudioFromUri = async ({ localUri, contentType = "audio/mpeg", fileName }) => {
  // 1) Presigned URL
  const fileExtension = inferAudioFileExtension(localUri, fileName, contentType);
  const { uploadUrl, audioKey } = await generateTodoUploadAudioUrl({ fileExtension });

  // 2) Read file into Blob via fetch
  const normalizedUri =
    typeof localUri === "string" &&
    !/^https?:\/\//.test(localUri) &&
    !localUri.startsWith("file://") &&
    !localUri.startsWith("content://")
      ? `file://${localUri}`
      : localUri;

  const resp = await fetch(normalizedUri);
  const blob = await resp.blob();

  // 3) PUT upload
  const putResp = await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": contentType },
  });
  if (!putResp.ok) {
    throw new Error(`Audio upload failed: ${putResp.status} ${putResp.statusText}`);
  }

  // 4) Notify backend
  const notifyResp = await todoAudioUploaded({ audioKey });
  const asyncTaskId = notifyResp?.data?.asyncTaskId;

  return { audioKey, uploaded_file_url: uploadUrl, asyncTaskId };
};

export const updateTask = (task) => async (dispatch, getState) => {
  dispatch({
    type: TYPES.UPDATE_TASK,
    payload: {
      task: { ...task, updated_at: new Date() },
    },
  });

  try {
    await APIMethod({
      endpoint: APIURLS.toDo,
      method: "PUT",
      body: task,
    });
  } catch (error) {
    logAPIError("updateTask error ==>", error);
    throw error;
  }
};

export const deleteTask = (id) => async (dispatch, getState) => {
  dispatch({
    type: TYPES.DELETE_TASK,
    payload: { id },
  });

  try {
    return await APIMethod({
      endpoint: APIURLS.toDo,
      method: "DELETE",
      params: { todo_id: id },
    });
  } catch (error) {
    logAPIError("deleteTask error ==>", error);
    throw error;
  }
};

export const setUnfetchedTasksCount = (status, count) => ({
  type: TYPES.SET_UNLOADED_COUNT,
  payload: { status, count },
});

// Draft Todos Actions
export const setDraftTodos = (draftTodos) => ({
  type: TYPES.SET_DRAFT_TODOS,
  payload: { draftTodos },
});

export const addDraftTodo = (draftTodo) => ({
  type: TYPES.ADD_DRAFT_TODO,
  payload: { draftTodo },
});

export const removeDraftTodo = (id) => ({
  type: TYPES.REMOVE_DRAFT_TODO,
  payload: { id },
});

export const setFocusModeFinishTime = (finishTime) => ({
  type: TYPES.SET_FOCUS_MODE_FINISH_TIME,
  payload: { finishTime },
});

export const setHasSeenPermissionIntro = () => ({
  type: TYPES.SET_HAS_SEEN_PERMISSION_INTRO,
});

export const setLateNoMoreEvents = (events) => ({
  type: TYPES.SET_LATE_NO_MORE_EVENTS,
  payload: { events },
});

export const lateNoMoreDismissEvent = (eventId) => ({
  type: TYPES.LATE_NO_MORE_DISMISS_EVENT,
  payload: { eventId },
});

export const setLateNoMoreConnectedPlatforms = (platforms) => ({
  type: TYPES.SET_LATE_NO_MORE_CONNECTED_PLATFORMS,
  payload: { platforms },
});

export const setLateNoMoreNotificationsEnabled = (enabled) => ({
  type: TYPES.SET_LATE_NO_MORE_NOTIFICATIONS_ENABLED,
  payload: { enabled },
});

export const setLateNoMoreReminderTimes = (times) => ({
  type: TYPES.SET_LATE_NO_MORE_REMINDER_TIMES,
  payload: { times },
});

export const setLateNoMoreRequireMeetingUrl = (enabled) => ({
  type: TYPES.SET_LATE_NO_MORE_STRICT_MEETING_DETECTION,
  payload: { enabled },
});

export const setHasDoneDailyMorningSession = () => ({
  type: TYPES.SET_HAS_DONE_DAILY_MORNING_SESSION,
});

export const setHasDoneDailyEveningSession = () => ({
  type: TYPES.SET_HAS_DONE_DAILY_EVENING_SESSION,
});

export const setHasDoneDailyFocusSession = () => ({
  type: TYPES.SET_HAS_DONE_DAILY_FOCUS_SESSION,
});

export const setHasCompletedFocusModeFirstTime = () => ({
  type: TYPES.SET_HAS_COMPLETED_FOCUS_MODE_FIRST_TIME,
});

export const resetDailyUserSession = () => ({
  type: TYPES.RESET_DAILY_SESSIONS_DONE,
});

export const setActivityAutostartEnabled = (enabled) => ({
  type: TYPES.SET_ACTIVITY_AUTOSTART_ENABLED,
  payload: { enabled },
});
