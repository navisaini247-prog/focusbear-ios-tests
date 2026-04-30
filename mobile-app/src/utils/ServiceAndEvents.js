import notifee from "@notifee/react-native";
import { displayNotification } from "@/screens/Notification";
import { store } from "@/store";
import { i18n } from "@/localization";
import { postHogCapture, logSentryError } from "./Posthog";
import { NOTIFICATION_ID, NOTIFICATION_PRESS_ID, POSTHOG_EVENT_NAMES } from "./Enums";
import { showDistractionWindow } from "./NativeModuleMethods";
import { checkIsAndroid } from "./PlatformMethods";
import { addErrorLog, addInfoLog } from "./FileLogger";
import { openBreathingExercise } from "@/navigation/deepLinkConfig";
import { getCurrentScreenName } from "@/navigation/root.navigator";
import { NAVIGATION } from "@/constants";
import { BLOCKING_MODE } from "@/constants/blockingSchedule";
import { setBlockedApp } from "@/actions/UserActions";
import { OverlayModule } from "@/nativeModule";
import { onPostPoneFlowFromDistractionAlert } from "@/actions/ActivityActions";
import { isFocusSuperStrictModeSelector } from "@/selectors/GlobalSelectors";
import {
  setRecentBreathingExercise,
  setLoggedActiveBypassPkg,
  clearLoggedActiveBypassPkg,
  setFloatingViewClosedOnButtonPress,
} from "@/actions/GlobalActions";

let eventListener = null;

let isForegroundServiceRunning = false;

// Flag to prevent multiple rapid navigations to breathing exercise
let isNavigatingToBreathingExercise = false;
const BREATHING_EXERCISE_NAVIGATION_COOLDOWN = 2000; // 2 seconds cooldown

const startForegroundService = async () => {
  if (!isForegroundServiceRunning) {
    try {
      const blockingReason = store.getState()?.global?.blockingReason ?? "";

      displayNotification({
        id: NOTIFICATION_ID.FOREGROUND_SERVICE,
        title: "Focus Bear",
        body: blockingReason + "\n" + i18n.t("notification.backgroundService"),
        asForegroundService: true,
        pressActionId: NOTIFICATION_PRESS_ID.FOREGROUND_SERVICE,
      });
      isForegroundServiceRunning = true;
    } catch (error) {
      addErrorLog("Failed to create and start foreground notification");
    }
  }
};

const stopForegroundService = async () => {
  try {
    await notifee.stopForegroundService();
    isForegroundServiceRunning = false;
  } catch (error) {
    addErrorLog("Failed to stop foreground notification");
  }
};

const blockApp = (event) => {
  const { isInFocusMode } = store.getState().focusMode;
  const isSuperStrictMode = isFocusSuperStrictModeSelector(store.getState());
  const easySkipModeEnabled = store.getState()?.user?.userLocalDeviceSettingsData?.MacOS?.kIsEasySkipEnabled ?? true;
  const currentScreenName = getCurrentScreenName();
  const scheduleMode = event?.SCHEDULE_BLOCKING_MODE;
  const isScheduleBlockingActive = Boolean(event?.IS_SCHEDULE_BLOCKING_ACTIVE);
  const isScheduleStrict =
    isScheduleBlockingActive && (scheduleMode === BLOCKING_MODE.STRICT || scheduleMode === BLOCKING_MODE.SUPER_STRICT);

  const easySkipCondition = easySkipModeEnabled && !isInFocusMode && currentScreenName !== NAVIGATION.RoutineDetail;
  const scheduleCondition = isScheduleBlockingActive && !isScheduleStrict;
  // If any active schedule is strict, always hard-block (no breathing exercise soft-block),
  // regardless of easy-skip settings.
  const canOpenBreathingExercise = !isScheduleStrict && (easySkipCondition || scheduleCondition);

  addInfoLog(
    `[BLOCK_APP] canOpenBreathingExercise check | easySkipCondition=${easySkipCondition} | scheduleCondition=${scheduleCondition} | canOpenBreathingExercise=${canOpenBreathingExercise}`,
  );

  if (canOpenBreathingExercise) {
    const recentBreathingExercise = store.getState().global.recentBreathingExercise;

    if (currentScreenName === NAVIGATION.BreathingExercise || isNavigatingToBreathingExercise) {
      addInfoLog(
        `BreathingExercise screen is already open or navigation in progress. Ignoring new event. | currentScreen=${currentScreenName} | isNavigating=${isNavigatingToBreathingExercise}`,
      );
      return;
    }

    const pkg = event?.BLOCK_APP_PACKAGE_NAME;

    if (
      recentBreathingExercise?.packageId === event?.BLOCK_APP_PACKAGE_NAME &&
      recentBreathingExercise?.bypassUntil &&
      recentBreathingExercise?.bypassUntil > Date.now()
    ) {
      const loggedMap = store.getState()?.global?.loggedActiveBypassPkgs ?? {};
      if (!loggedMap[pkg]) {
        store.dispatch(setLoggedActiveBypassPkg(pkg));
        addInfoLog(
          `[SOFT_BLOCK] bypass active | pkg=${pkg} | until=${new Date(
            recentBreathingExercise.bypassUntil,
          ).toISOString()}`,
        );
      }
      return;
    }

    if (
      recentBreathingExercise?.packageId === event?.BLOCK_APP_PACKAGE_NAME &&
      recentBreathingExercise?.bypassUntil &&
      recentBreathingExercise?.bypassUntil <= Date.now()
    ) {
      addInfoLog(
        `[SOFT_BLOCK] bypass expired -> clearing | pkg=${event?.BLOCK_APP_PACKAGE_NAME} | until=${new Date(
          recentBreathingExercise.bypassUntil,
        ).toISOString()} | now=${new Date().toISOString()}`,
      );
      store.dispatch(clearLoggedActiveBypassPkg(event?.BLOCK_APP_PACKAGE_NAME));
      store.dispatch(setRecentBreathingExercise(null, null, null, null));
    }

    addInfoLog(
      `[BLOCK_APP] Opening breathing exercise | app=${event?.BLOCK_APP_NAME} | pkg=${event?.BLOCK_APP_PACKAGE_NAME}`,
    );

    isNavigatingToBreathingExercise = true;
    setTimeout(() => {
      isNavigatingToBreathingExercise = false;
    }, BREATHING_EXERCISE_NAVIGATION_COOLDOWN);

    postHogCapture(POSTHOG_EVENT_NAMES.SOFT_BLOCK_ANDROID);
    openBreathingExercise(event?.BLOCK_APP_NAME, event?.BLOCK_APP_PACKAGE_NAME);
  } else {
    addInfoLog(
      `[BLOCK_APP] Showing distraction window | pkg=${event?.BLOCK_APP_PACKAGE_NAME} | isInFocusMode=${isInFocusMode} | isSuperStrictMode=${isSuperStrictMode} | shouldHideApp=${event?.SHOULD_HIDE_APP} | blockedUrl=${event?.BLOCKED_URL} | isScheduleBlockingActive=${isScheduleBlockingActive} | scheduleName=${event?.ACTIVE_SCHEDULE_NAME}`,
    );

    store.dispatch(setBlockedApp(event?.BLOCK_APP_PACKAGE_NAME));

    let reason = "";

    if (isScheduleBlockingActive && event?.ACTIVE_SCHEDULE_NAME && event?.BLOCK_APP_NAME) {
      reason = i18n.t("blockingSchedule.appBlockedBySchedule", {
        appName: event.BLOCK_APP_NAME,
        scheduleName: event.ACTIVE_SCHEDULE_NAME,
      });
    }

    showDistractionWindow(
      event?.ACTIVE_SCHEDULE_NAME ?? "",
      "",
      isInFocusMode,
      isSuperStrictMode,
      reason,
      event?.SHOULD_HIDE_APP,
      event?.BLOCKED_URL,
    );
  }
};

let isProcessing = false;

async function handleGetCurrentActivityEvent(event) {
  if (isProcessing) {
    addInfoLog("GET_CURRENT_ACTIVITY is already processing. Ignoring new event.");
    return;
  }

  isProcessing = true;

  try {
    blockApp(event);
  } catch (error) {
    const exception = new Error(error);
    logSentryError(exception);
    addErrorLog("Error in GET_CURRENT_ACTIVITY processing:", error);
  } finally {
    isProcessing = false;
  }
}

const startOverlayListener = () => {
  addInfoLog("Come to listener --------------------------------");
  if (checkIsAndroid()) {
    eventListener = OverlayModule.onOverlayEvent((eventString) => {
      try {
        const event = JSON.parse(eventString); // Parse the JSON string

        if (event.GET_CURRENT_ACTIVITY) {
          handleGetCurrentActivityEvent(event);
        }
        if (event.OPEN_APP) {
          notifee.cancelAllNotifications().then(() => {
            addInfoLog("check removed notifications");
          });
        }
        if (event.POSTPONE_FLOW_FROM_DISTRACTION_ALERT_BOOL) {
          store.dispatch(onPostPoneFlowFromDistractionAlert(true));
        }
        if (event.IS_DISTRACTION_ALERT_OPEN) {
          postHogCapture(POSTHOG_EVENT_NAMES.BLOCK_DISTRACTION);
        }
        if (event.ON_PRESS_CLOSE_FLOATING_VIEW) {
          addInfoLog("Closed floating view on pressing close button ======>");
          store.dispatch(setFloatingViewClosedOnButtonPress(true));
        }
      } catch (e) {
        console.log("[TurboModule] onOverlayEvent (parsing error)", e);
      }
    });
  }
};

export { startForegroundService, stopForegroundService, startOverlayListener };
