import { callAction, store } from "@/store";
import { requireNativeComponent } from "react-native";
import { setStartBlocking, setStopBlocking } from "@/actions/ActivityActions";
import { checkIsAndroid, checkIsIOS } from "./PlatformMethods";
import { NormalAlert } from "./GlobalMethods";
import { startForegroundService } from "./ServiceAndEvents";
import { sendMessage } from "react-native-watch-connectivity";
import { addErrorLog, addInfoLog } from "./FileLogger";
import { setFloatingViewClosedOnButtonPress, setScheduleBlockingStatus } from "@/actions/GlobalActions";
import { RESTRICTED_APPS_LIST_TYPE, WATCH_COMMAND } from "./Enums";
import { i18n } from "@/localization";

import { NativeModules } from "react-native";
import {
  ScheduleTasksModule,
  UsagePermissionModule,
  FloatingViewModule,
  AccessibilityModule,
  LauncherKit,
  OverlayModule,
  BlockingScheduleModule,
  FocusWidgetModule,
} from "@/nativeModule";

// ❌ completely disable native ControlFunctionModule
const ControlFunctionModule = null;
const { FocusBearWearCommunicationModule } = NativeModules;

// Safe fallback for iOS Appium testing when ControlFunction native module is unavailable
const ControlFunction = {
  checkPermissionsFromReact: (cb) => cb && cb(null, false),
  getScreenTimePermission: (cb) => cb && cb(0),
  revokeScreenTimePermission: (cb) => cb && cb(false),

  startBlockingDistractingApps: () => {},
  setCurrentUseGlobalBlockList: () => {},
  stopBlockingDistractingApps: () => {},
  pauseBlockingWithResume: () => {},
  pauseSchedulesIndefinitely: () => {},
  resumeScheduleBlocking: () => {},
  clearBlockList: () => {},

  getBlockedAppsCount: (cb) =>
    cb &&
    cb({
      blockedApplicationsCount: 0,
      blockedApplicationCategoriesCount: 0,
    }),

  setBlockingReason: () => {},
  setBlockingStatus: () => {},
  setNextActivityInfo: () => {},
  setHighFrictionMode: () => {},
  setSuperStrictMode: () => {},
  saveCustomBlockedMessage: () => {},
  saveBaseDelay: () => {},
  reloadWidget: () => {},
};

/**
 * This Method to be called when we want to start overlay over third party apps.
 * When we have all the permissions we required to overlay design.
 */

const ControlView = requireNativeComponent("ControlView");
const BlockListView = requireNativeComponent("BlockListView");

const showWarningIfScreentimePermissionsNotAllowed = async (fallbackMessage) => {
  if (checkIsAndroid()) {
    return true;
  }
  try {
    const isAuthorized = await checkScreenTimePermission();
    return isAuthorized;
  } catch (error) {
    NormalAlert({
      message: fallbackMessage,
    });
    addErrorLog("Error during permission check:", error);
    return false;
  }
};

const checkScreenTimePermission = () => {
  return new Promise((resolve, reject) => {
    ControlFunction.checkPermissionsFromReact((error, isAuthorized) => {
      if (error) {
        addErrorLog("Permission check failed with error:", error);
        reject(error);
      } else {
        resolve(isAuthorized);
      }
    });
  });
};

const getScreenTimePermission = () => {
  return new Promise((resolve, reject) => {
    try {
      ControlFunction.getScreenTimePermission((isAuthorized) => {
        resolve(isAuthorized);
      });
    } catch (error) {
      addErrorLog("Error during permission check:", error);
      reject(error);
    }
  });
};

const revokeScreenTimePermission = () => {
  return new Promise((resolve, reject) => {
    try {
      ControlFunction.revokeScreenTimePermission((isAuthorized) => {
        resolve(isAuthorized);
      });
    } catch (error) {
      addErrorLog("Error during permission check:", error);
      reject(error);
    }
  });
};

const startOverlayServiceNativeMethod = async ({
  routineName = "",
  activityName = "",
  allowedApps = [],
  hours = 12,
  minutes = 0,
  useGlobalBlockList = false,
} = {}) => {
  if (checkIsAndroid()) {
    const { isOverlayPermissionGranted } = store.getState().global;
    if (isOverlayPermissionGranted) {
      startForegroundService();
      OverlayModule.startService(routineName, activityName, allowedApps, useGlobalBlockList);
    }
  } else if (checkIsIOS()) {
    ControlFunction.setCurrentUseGlobalBlockList?.(useGlobalBlockList);
    ControlFunction.startBlockingDistractingApps(hours, minutes);
  }

  callAction(setStartBlocking());
  addInfoLog("startOverlayServiceNativeMethod() called!");
};

const stopOverlayServiceNativeMethod = () => {
  addInfoLog("stopOverlayServiceNativeMethod() called!");

  if (checkIsAndroid()) {
    OverlayModule.stopOverlayService();
  } else if (checkIsIOS()) {
    ControlFunction.stopBlockingDistractingApps();
  }

  callAction(setStopBlocking());
};

const pauseBlockingWithResumeNativeMethod = (hours, minutes, reason) => {
  addInfoLog(`pauseBlockingWithResumeNativeMethod() called! Hours: ${hours}, Minutes: ${minutes}, Reason: ${reason}`);

  if (checkIsAndroid()) {
    BlockingScheduleModule.pauseBlockingWithResume(hours, minutes, reason);
  } else if (checkIsIOS()) {
    ControlFunction.pauseBlockingWithResume(hours, minutes, reason);
  }

  callAction(setStopBlocking());
};

const pauseBlockingSchedulesIndefinitelyNativeMethod = () => {
  addInfoLog("pauseBlockingSchedulesIndefinitelyNativeMethod() called");

  if (checkIsAndroid()) {
    BlockingScheduleModule.pauseSchedulesIndefinitely();
  } else if (checkIsIOS()) {
    ControlFunction.pauseSchedulesIndefinitely();
  }
};

const getBlockingSchedulesNativeMethod = async () => {
  try {
    if (checkIsIOS() && ControlFunctionModule?.getBlockingSchedules) {
      const response = await ControlFunctionModule.getBlockingSchedules();
      return Array.isArray(response) ? response : [];
    }

    if (checkIsAndroid() && BlockingScheduleModule?.getBlockingSchedules) {
      const response = await BlockingScheduleModule.getBlockingSchedules();
      return Array.isArray(response) ? response : [];
    }
  } catch (error) {
    addErrorLog("Failed to fetch blocking schedules", error);
  }

  return [];
};

const clearAllBlockingSchedulesNativeMethod = async () => {
  try {
    if (checkIsIOS() && ControlFunctionModule?.clearAllBlockingSchedules) {
      await ControlFunctionModule.clearAllBlockingSchedules();
      return true;
    }

    if (checkIsAndroid() && BlockingScheduleModule?.clearAllBlockingSchedules) {
      await BlockingScheduleModule.clearAllBlockingSchedules();
      return true;
    }
  } catch (error) {
    addErrorLog("Failed to clear blocking schedules", error);
  }

  return false;
};

const getScheduleBlockingStatusNativeMethod = async () => {
  try {
    if (checkIsIOS() && ControlFunctionModule?.getScheduleBlockingStatus) {
      return await ControlFunctionModule.getScheduleBlockingStatus();
    }

    if (checkIsAndroid() && BlockingScheduleModule?.getScheduleBlockingStatus) {
      return await BlockingScheduleModule.getScheduleBlockingStatus();
    }
  } catch (error) {
    addErrorLog("Failed to fetch schedule blocking status", error);
  }

  return null;
};

const updateScheduleBlockingStatus = async () => {
  const status = await getScheduleBlockingStatusNativeMethod();
  store.dispatch(setScheduleBlockingStatus(status));
  return status;
};

const syncHabitBlockingWindowsNativeMethod = async (windows) => {
  if (!Array.isArray(windows) || windows.length === 0) {
    return;
  }

  try {
    const payload = JSON.stringify(windows);

    if (checkIsIOS() && ControlFunctionModule?.setHabitBlockingWindows) {
      await ControlFunctionModule.setHabitBlockingWindows(payload);
      addInfoLog(`[ScheduleCreation] Successfully synced ${windows.length} schedules to iOS`);
    } else if (checkIsAndroid()) {
      await BlockingScheduleModule.setBlockingSchedules(payload);
      addInfoLog(`[ScheduleCreation] Successfully synced ${windows.length} schedules to Android`);
    }
  } catch (error) {
    addErrorLog(
      `[ScheduleCreation] Failed to sync schedules: ${error?.message ?? error?.toString?.() ?? "unknown error"}`,
    );
    throw error;
  }
};

const updateGlobalBlockingEnabledNativeMethod = async (enabled) => {
  if (checkIsAndroid()) {
    OverlayModule.updateGlobalBlockingEnabled(enabled);
    addInfoLog(`Updated global blocking flag to ${enabled}`);
  } else if (checkIsIOS()) {
    ControlFunction.setCurrentUseGlobalBlockList?.(enabled);
    addInfoLog(`Updated iOS global blocking flag to ${enabled}`);
  }
};

const getGlobalHabitBlockingEnabledNativeMethod = async () => {
  try {
    if (checkIsIOS() && ControlFunctionModule?.getGlobalHabitBlockingEnabled) {
      return await new Promise((resolve, reject) => {
        try {
          ControlFunctionModule.getGlobalHabitBlockingEnabled((result) => {
            const value = Array.isArray(result) ? result[0] : result;
            resolve(Boolean(value));
          });
        } catch (error) {
          reject(error);
        }
      });
    }

    if (checkIsAndroid() && BlockingScheduleModule?.getGlobalHabitBlockingEnabled) {
      const enabled = await BlockingScheduleModule.getGlobalHabitBlockingEnabled();
      return Boolean(enabled);
    }
  } catch (error) {
    addErrorLog("Failed to fetch global habit blocking enabled value", error);
  }

  return null;
};

const resumeBlockingSchedulesNativeMethod = () => {
  addInfoLog("resumeBlockingSchedulesNativeMethod() called");

  if (checkIsAndroid()) {
    BlockingScheduleModule.resumeScheduleBlocking();
  } else if (checkIsIOS()) {
    ControlFunction.resumeScheduleBlocking();
  }
};

const scheduleTaskNativeMethod = (timeInMinutes) => {
  ScheduleTasksModule.scheduleTask(timeInMinutes);
};

const resumeBlockingAfterPostponeDuration = (postponeDuration) => {
  if (checkIsAndroid()) {
    ScheduleTasksModule.scheduleTask(`${postponeDuration}`);
  }
};

const storeUpcomingActivityAndRoutineMethod = async (upcomingRoutineName = "", activityName = "", allowedApps = []) => {
  if (checkIsAndroid()) {
    OverlayModule.storeUpcomingRoutineMessage(upcomingRoutineName, activityName, allowedApps);
  }
};

const saveAllowedAppsPreference = async (allowed_apps = []) => {
  if (checkIsAndroid()) {
    OverlayModule.saveAllowedAppsPreference(allowed_apps);
  }
};

const saveBlockedAppsPreference = async (blocked_apps = []) => {
  if (checkIsAndroid()) {
    OverlayModule.saveBlockedAppsPreference(blocked_apps);
  }
};

const showFloatingView = (
  isStarted,
  time = 0,
  activityName = "",
  completionRequirements = "",
  isTimerPaused = false,
) => {
  if (checkIsAndroid()) {
    FloatingViewModule.runFloatingView(isStarted, time, activityName, completionRequirements, isTimerPaused);
  }
};

const hideFloatingView = () => {
  if (checkIsAndroid()) {
    store.dispatch(setFloatingViewClosedOnButtonPress(false));
    FloatingViewModule.stopFloatingView();
  }
};

const showDistractionWindow = (
  routineName = "",
  activityName = "",
  isInFocusMode = false,
  isInSuperStrictMode = false,
  reason = "",
  shouldHideApp = true,
  blockedUrl = "",
) => {
  if (checkIsAndroid()) {
    OverlayModule.showDistractionWindow(
      routineName,
      activityName,
      isInFocusMode,
      isInSuperStrictMode,
      reason,
      shouldHideApp,
      blockedUrl,
    );
  }
};

const saveInstalledApps = () => {
  if (checkIsAndroid()) {
    OverlayModule.saveInstalledApps();
  }
};

const getAndroidInstalledApps = async () => {
  if (checkIsAndroid()) {
    try {
      const installedApps = await OverlayModule.getApps();
      return installedApps;
    } catch (error) {
      addErrorLog("Error fetching installed apps:", error);
      return [];
    }
  }
};

const setActivitySpecificAllowedApps = (allowedApps) => {
  if (checkIsAndroid()) {
    OverlayModule.saveActivitySpecificAllowedApps(allowedApps);
  }
};

const sendDataToWatchApp = ({ text = "", DATA_TYPE = WATCH_COMMAND.PLAY_OR_PAUSE_NEXT_LOGICAL_ACTIVITY }) => {
  const Stringify = (data) => (typeof data === "string" ? data : JSON.stringify(data));

  switch (DATA_TYPE) {
    case WATCH_COMMAND.PLAY_OR_PAUSE_NEXT_LOGICAL_ACTIVITY:
      if (checkIsAndroid()) {
        FocusBearWearCommunicationModule.sendDataToWearApp(Stringify(text));
      } else {
        sendMessage({ text: Stringify(text) });
      }
      break;
    case WATCH_COMMAND.SET_ACTIVITY_OUT_OF_ORDER:
      if (checkIsAndroid()) {
        FocusBearWearCommunicationModule.sendObjectToWearApp(text, false);
      } else {
        sendMessage({ text: Stringify(text), isInitial: true });
      }
      break;
    case WATCH_COMMAND.SET_ACTIVITY_AT_START_OF_ROUTINE:
      if (checkIsAndroid()) {
        FocusBearWearCommunicationModule.sendObjectToWearApp(text, true);
      } else {
        sendMessage({ text: Stringify(text), isInitial: true });
      }
      break;
    case WATCH_COMMAND.SET_ACTIVITY_CONTINUE_ON_YOUR_PHONE:
      if (checkIsAndroid()) {
        FocusBearWearCommunicationModule.sendDataToWearApp(DATA_TYPE);
      } else {
        sendMessage({ text: WATCH_COMMAND.SET_ACTIVITY_CONTINUE_ON_YOUR_PHONE, isInitial: true });
      }
      break;
    case WATCH_COMMAND.SEND_TODO_LIST:
      if (checkIsAndroid()) {
        FocusBearWearCommunicationModule.sendTodoListToWearApp?.(Stringify(text));
      } else {
        sendMessage({ text: Stringify(text), todoList: true });
      }
      break;
    default:
      break;
  }
};

const getBlockedAppsCountFromIOS = () => {
  return new Promise((resolve, reject) => {
    if (checkIsIOS()) {
      ControlFunction.getBlockedAppsCount((blockListCounts) => {
        resolve(blockListCounts);
      });
    } else {
      reject(new Error("Not running on iOS."));
    }
  });
};

const saveRestrictedAppsListTypeToAndroid = (restrictedAppListType = RESTRICTED_APPS_LIST_TYPE.BLOCK_LIST) => {
  if (checkIsAndroid()) {
    OverlayModule.saveRestrictedAppsListType(restrictedAppListType);
  }
};

const requestIgnoreBatteryOptimization = async () => {
  return new Promise((resolve, reject) => {
    if (checkIsAndroid()) {
      UsagePermissionModule.ignoreBatteryOptimisation().then((granted) => {
        resolve(granted);
      });
    } else {
      reject(new Error("Not running on iOS."));
    }
  });
};

const getIgnoreBatteryOptimizationPermission = async () => {
  return new Promise((resolve, reject) => {
    if (checkIsAndroid()) {
      UsagePermissionModule.getIgnoreBatteryOptimisationPermission().then((granted) => {
        resolve(granted);
      });
    } else {
      reject(new Error("Not running on iOS."));
    }
  });
};

const requestDNDPermissions = () => {
  if (checkIsAndroid()) {
    OverlayModule.requestNotificationPolicyDNDPermission();
  }
};

const checkIsDNDPermissionGranted = () => {
  return new Promise((resolve, reject) => {
    if (checkIsAndroid()) {
      OverlayModule.isNotificationPolicyDNDPermissionEnabled()
        .then((isGranted) => {
          resolve(isGranted);
        })
        .catch((error) => {
          addErrorLog("Error checking DND permission:", error);
          reject(false);
        });
    } else {
      resolve(false);
    }
  });
};

const shouldEnableDNDMode = (shouldEnable = false) => {
  if (checkIsAndroid()) {
    OverlayModule.shouldEnableDNDMode(shouldEnable);
  }
};

const refreshWidgetData = () => {
  if (checkIsIOS()) {
    ControlFunction.reloadWidget();
  }
};

export const WIDGET_NEXT_HABIT_PLACEHOLDER = {
  START_FOCUS_SESSION: "start_focus_session",
  GO_TO_SLEEP: "go_to_sleep",
};

const resolveWidgetDeepLinkTarget = (blockingReasonKey, nextHabitPlaceholderKey) => {
  if (blockingReasonKey === "permissionNotGranted") return "permissions";
  if (blockingReasonKey === "focusModeActivated") return "focus";
  if (
    nextHabitPlaceholderKey === WIDGET_NEXT_HABIT_PLACEHOLDER.START_FOCUS_SESSION ||
    nextHabitPlaceholderKey === WIDGET_NEXT_HABIT_PLACEHOLDER.GO_TO_SLEEP
  ) {
    return "focus";
  }
  return "home";
};

const showWidgetRoutineData = (
  routineName,
  blockingReason,
  nextHabitName,
  blockingReasonKey,
  whatsNextPrefix,
  defaultTexts,
  themeMode,
  nextHabitPlaceholderKey = null,
) => {
  if (checkIsAndroid() && FocusWidgetModule?.updateWidget) {
    const reasonKey = blockingReasonKey ?? null;
    const deepLinkTarget = resolveWidgetDeepLinkTarget(reasonKey, nextHabitPlaceholderKey);
    const defaults = defaultTexts || {
      defaultRoutine: i18n.t("widget.defaultRoutine"),
      noReasonProvided: i18n.t("widget.noReasonProvided"),
      noNextHabit: i18n.t("widget.noNextHabit"),
    };
    const safeWhatsNextPrefix =
      typeof whatsNextPrefix === "string" && whatsNextPrefix.trim() && !whatsNextPrefix.includes("widget.whatsNext")
        ? whatsNextPrefix.trim()
        : i18n.t("widget.whatsNext");
    const safeRoutineName =
      typeof routineName === "string" && routineName.trim() ? routineName : defaults.defaultRoutine;
    const safeBlockingReason =
      typeof blockingReason === "string" && blockingReason.trim() ? blockingReason : defaults.noReasonProvided;
    const safeNextHabitName =
      typeof nextHabitName === "string" && nextHabitName.trim() ? nextHabitName : defaults.noNextHabit;

    FocusWidgetModule.updateWidget(
      safeRoutineName,
      safeBlockingReason,
      safeNextHabitName,
      reasonKey,
      safeWhatsNextPrefix,
      defaults.defaultRoutine,
      defaults.noReasonProvided,
      defaults.noNextHabit,
      themeMode || "dark",
      deepLinkTarget,
      nextHabitPlaceholderKey,
    );
  }
};

const updateStreakWidget = (
  morningStreak,
  eveningStreak,
  focusStreak,
  morningDone,
  eveningDone,
  focusDone,
  labels,
  themeMode,
) => {
  if (checkIsAndroid() && FocusWidgetModule?.updateStreakWidget) {
    FocusWidgetModule.updateStreakWidget(
      morningStreak ?? 0,
      eveningStreak ?? 0,
      focusStreak ?? 0,
      morningDone ?? false,
      eveningDone ?? false,
      focusDone ?? false,
      labels?.title ?? null,
      labels?.morning ?? null,
      labels?.evening ?? null,
      labels?.focus ?? null,
      labels?.day ?? null,
      themeMode || "dark",
    );
  }
};

const updateBlockedMessageWidget = (message, themeMode) => {
  if (checkIsAndroid() && FocusWidgetModule?.updateBlockedMessageWidget) {
    const themeForNative = themeMode === undefined || themeMode === null ? null : themeMode || "dark";
    FocusWidgetModule.updateBlockedMessageWidget(message ?? "", themeForNative);
  }
};

const refreshAllWidgets = () => {
  if (checkIsAndroid() && FocusWidgetModule?.refreshAllWidgets) {
    FocusWidgetModule.refreshAllWidgets();
  }
};

const syncAndroidWidgetAppTheme = (themeMode) => {
  if (checkIsAndroid() && FocusWidgetModule?.syncAppThemeForWidgets) {
    FocusWidgetModule.syncAppThemeForWidgets(themeMode ?? "dark");
  }
};

const setFrictionMode = (isHighFrictionMode = false) => {
  if (checkIsIOS()) {
    ControlFunction.setHighFrictionMode(isHighFrictionMode);
  }
};

const setSuperStrictModeNative = (enabled = false) => {
  if (checkIsIOS()) {
    ControlFunction.setSuperStrictMode(enabled);
  }
};

const checkAccessibilityPermission = () => {
  return new Promise((resolve, reject) => {
    if (checkIsAndroid()) {
      AccessibilityModule.checkAccessibilityPermission()
        .then((isGranted) => {
          resolve(isGranted);
        })
        .catch((error) => {
          addErrorLog("Error checking accessibility permission:", error);
          reject(false);
        });
    } else {
      resolve(false);
    }
  });
};

const grantAccessibilityPermission = () => {
  return new Promise((resolve, reject) => {
    if (checkIsAndroid()) {
      AccessibilityModule.grantAccessibilityPermission()
        .then(() => {
          resolve(true);
        })
        .catch((error) => {
          addErrorLog("Error requesting accessibility permission:", error);
          reject(false);
        });
    } else {
      reject(new Error("Not running on Android."));
    }
  });
};

const revokeAccessibilityPermission = () => {
  return new Promise((resolve, reject) => {
    if (checkIsAndroid()) {
      AccessibilityModule.revokeAccessibilityPermission()
        .then((success) => {
          resolve(success);
        })
        .catch((error) => {
          addErrorLog("Error revoking accessibility permission:", error);
          reject(false);
        });
    } else {
      reject(new Error("Not running on Android."));
    }
  });
};

const getAppIcons = async (packageNames) => {
  if (!checkIsAndroid()) {
    throw new Error("Not running on Android.");
  }

  const allApps = await OverlayModule.getApps();
  const iconMap = {};

  allApps.forEach((app) => {
    if (packageNames.includes(app.packageName) && app.icon) {
      iconMap[app.packageName] = app.icon;
    }
  });

  return iconMap;
};

const getAppUsageStats = async (startTime, endTime) => {
  if (!checkIsAndroid()) {
    throw new Error("Not running on Android.");
  }

  const [usageStats, allAppsResponse] = await Promise.all([
    UsagePermissionModule.getAppUsageStats(startTime, endTime),
    LauncherKit.getAppsEnhanced(false, false),
  ]);

  let allApps = [];
  try {
    allApps = JSON.parse(allAppsResponse);
  } catch (error) {
    addErrorLog("Error parsing LauncherKit response:", error);
    allApps = [];
  }

  const iconMap = {};
  allApps.forEach((app) => {
    if (app.icon) {
      iconMap[app.packageName] = app.icon;
    }
  });

  return usageStats.map((stat) => ({
    ...stat,
    icon: iconMap[stat.packageName] || null,
  }));
};

const removeBlockingScheduleNativeMethod = async (scheduleId) => {
  if (checkIsAndroid() && BlockingScheduleModule?.removeBlockingSchedule) {
    await BlockingScheduleModule.removeBlockingSchedule(scheduleId);
  }
  if (checkIsIOS() && ControlFunctionModule?.removeBlockingSchedule) {
    await ControlFunctionModule.removeBlockingSchedule(scheduleId);
  }
};

export {
  removeBlockingScheduleNativeMethod,
  getAppUsageStats,
  setFrictionMode,
  setSuperStrictModeNative,
  refreshWidgetData,
  showWidgetRoutineData,
  requestIgnoreBatteryOptimization,
  startOverlayServiceNativeMethod,
  stopOverlayServiceNativeMethod,
  pauseBlockingWithResumeNativeMethod,
  pauseBlockingSchedulesIndefinitelyNativeMethod,
  resumeBlockingSchedulesNativeMethod,
  getBlockingSchedulesNativeMethod,
  clearAllBlockingSchedulesNativeMethod,
  getScheduleBlockingStatusNativeMethod,
  updateScheduleBlockingStatus,
  syncHabitBlockingWindowsNativeMethod,
  updateGlobalBlockingEnabledNativeMethod,
  getGlobalHabitBlockingEnabledNativeMethod,
  scheduleTaskNativeMethod,
  resumeBlockingAfterPostponeDuration,
  storeUpcomingActivityAndRoutineMethod,
  saveAllowedAppsPreference,
  showFloatingView,
  hideFloatingView,
  sendDataToWatchApp,
  ControlView,
  BlockListView,
  ControlFunction,
  checkScreenTimePermission,
  showWarningIfScreentimePermissionsNotAllowed,
  showDistractionWindow,
  saveInstalledApps,
  setActivitySpecificAllowedApps,
  getAndroidInstalledApps,
  getBlockedAppsCountFromIOS,
  saveRestrictedAppsListTypeToAndroid,
  saveBlockedAppsPreference,
  getScreenTimePermission,
  revokeScreenTimePermission,
  requestDNDPermissions,
  checkIsDNDPermissionGranted,
  shouldEnableDNDMode,
  getIgnoreBatteryOptimizationPermission,
  checkAccessibilityPermission,
  grantAccessibilityPermission,
  revokeAccessibilityPermission,
  getAppIcons,
  updateStreakWidget,
  updateBlockedMessageWidget,
  refreshAllWidgets,
  syncAndroidWidgetAppTheme,
};