import { NavigationContainer } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef } from "react";
import { DeviceEventEmitter } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { useDispatch } from "react-redux";
import { OnBoardingNavigator } from "@/navigation/OnBoardingNavigator";
import { participantCodeSelector, userAccessTokenSelector, userIdSelector } from "@/selectors/UserSelectors";
import { appLanguageSelector, appThemeSelector } from "@/selectors/GlobalSelectors";
import { theme as themes } from "@/theme";
import BootSplash from "react-native-bootsplash";
import LateNoMoreManager from "@/controllers/LateNoMoreManager";
import notifee, { AuthorizationStatus, EventType } from "@notifee/react-native";
import { isPushNotificationAskedStatusSelector } from "@/selectors/GlobalSelectors";
import {
  setPostponeActivated,
  updateIsPushNotificationAskedStatus,
  TYPES as GLOBAL_TYPES,
  setFirstAppOpenPostHogCaptured,
  preLoadInstalledApps,
} from "@/actions/GlobalActions";
import { store } from "@/store";
import { setIsPhysicalActivityPermissionDisabled } from "@/actions/GlobalActions";
import { useTranslation } from "react-i18next";
import { changeFocusModeState } from "@/actions/FocusModeActions";
import {
  getUserDetails,
  getUserLocalDeviceSettings,
  getUserSubscription,
  updateMotivationMessageShown,
  getCurrentActivityProps,
  lateNoMoreDismissEvent,
  postUserLocalDeviceSettings,
} from "@/actions/UserActions";
import Purchases from "react-native-purchases";
import {
  ENTITLEMENT_ID_TRIAL,
  NOTIFICATION_ID,
  NOTIFICATION_PRESS_ID,
  REVENUECAT_API_KEY_APPLE,
  REVENUECAT_API_KEY_GOOGLE,
} from "@/utils/Enums";
import { userRoutineDataAction } from "@/actions/RoutineActions";
import { callAction } from "@/store";
import { setStopBlocking } from "@/actions/ActivityActions";
import { useOnBoardingStatus } from "@/hooks/use-onboarding-status";
import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import { LauncherContextProvider } from "./AppLauncher/context";
import { AppMenuOverlay } from "./AppLauncher/AppMenuOverlay";
import { HomeContextProvider } from "@/screens/Home/context";
import { OverlayModule } from "@/nativeModule";
import { posthog, postHogIdentify } from "@/utils/Posthog";
import { useSelector } from "@/reducers";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ToastComponentLayout";
import { camelCase, startCase } from "lodash";
import { addInfoLog, addErrorLog, logAPIError } from "@/utils/FileLogger";
import * as Sentry from "@sentry/react-native";
import { getCurrentRoute, isMountedRef, navigationRef, notifyRouteChanged } from "@/navigation/root.navigator";
import { NAVIGATION, PLATFORMS } from "@/constants";
import { systemLanguage, baseLanguages } from "@/localization";
import { linking } from "./deepLinkConfig";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { useParticipantCode } from "@/hooks/useParticipantCode";
import { VerifyPasswordModal } from "@/modals/VerifyPasswordModal";
import { PostponeModal } from "@/modals/PostponeModal";
import { TaskModal } from "@/modals/TaskModal";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { AuthNavigator } from "./AuthNavigator";
import { AppNavigator } from "./AppNavigator";
import {
  resumeBlockingSchedulesNativeMethod,
  syncAndroidWidgetAppTheme,
  updateScheduleBlockingStatus,
} from "@/utils/NativeModuleMethods";
import { useEventBatchSender } from "@/hooks/useEventBatchSender";
import moment from "moment";
import "moment/locale/es";
import "moment/locale/de";
import "moment/locale/ja";
import "moment/locale/vi";
import "moment/locale/zh-tw";
import "moment/locale/zh-cn";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StreakAnimation } from "@/components/StreakAnimation";
moment.locale(systemLanguage);

const reactNavigationIntegration = Sentry.reactNavigationIntegration();

export function RootNavigator() {
  const dispatch = useDispatch();
  const { linkCode } = useParticipantCode();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  });

  useEventBatchSender();

  // The isBlocking flag should not be true when app is launched
  useEffect(() => {
    callAction(setStopBlocking());
  }, []);

  const accessToken = useSelector(userAccessTokenSelector);
  const userId = useSelector(userIdSelector);
  const participantCode = useSelector(participantCodeSelector);

  const routeNameRef = useRef();

  const appTheme = useSelector(appThemeSelector) || "dark";
  const theme = themes[appTheme] || themes.dark;
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (checkIsAndroid()) {
      syncAndroidWidgetAppTheme(appTheme);
    }
  }, [appTheme]);
  const isPushNotificationAskedStatus = useSelector(isPushNotificationAskedStatusSelector);
  const userSubscriptionDetails = useSelector((state) => state.user?.userSubscriptionDetails);
  const appLanguage = useSelector(appLanguageSelector);
  const isOnBoardingStatus = useOnBoardingStatus();
  const preLoadedInstalledApps = useSelector((state) => state.global.installedAppsData);

  const initialApiRequest = async () => {
    await Promise.all([
      dispatch(userRoutineDataAction()),
      dispatch(getUserDetails()),
      dispatch(getUserSubscription()),
      dispatch(getUserLocalDeviceSettings()),
      dispatch(getCurrentActivityProps()),
    ]);
  };

  useEffect(() => {
    const getPushNotifStatus = async () => {
      const settings = await notifee.getNotificationSettings();
      const authStatus = settings?.authorizationStatus;

      // Mark as asked once OS has a determined notification state
      const hasBeenAsked = authStatus !== AuthorizationStatus.NOT_DETERMINED;

      if (hasBeenAsked && !isPushNotificationAskedStatus) {
        dispatch(updateIsPushNotificationAskedStatus(true));
      }
    };
    getPushNotifStatus();
  }, [dispatch, isPushNotificationAskedStatus]);

  useEffect(() => {
    if (accessToken) {
      initialApiRequest();

      dispatch(updateMotivationMessageShown(false));
      dispatch(changeFocusModeState(false));
      postHogIdentify(
        userId,
        userSubscriptionDetails &&
          userSubscriptionDetails?.activeEntitlements?.every((entitlement) => entitlement !== ENTITLEMENT_ID_TRIAL),
      );
      store.dispatch(
        setIsPhysicalActivityPermissionDisabled(posthog.isFeatureEnabled("disable-physical-activity-permission")),
      );

      // Save pending bearsona if set during onboarding (before login)
      const savePendingBearsona = async () => {
        const globalState = store.getState().global;
        if (globalState?.pendingBearsona) {
          try {
            await dispatch(postUserLocalDeviceSettings({ bearsonaName: globalState.pendingBearsona }, PLATFORMS.MACOS));
            dispatch({ type: GLOBAL_TYPES.CLEAR_PENDING_BEARSONA });
            addInfoLog("Saved pending bearsona after login:", globalState.pendingBearsona);
          } catch (error) {
            logAPIError("Error saving pending bearsona after login:", error);
          }
        }
      };
      savePendingBearsona();
    }
  }, [dispatch, accessToken, isOnBoardingStatus]);

  // Subscribe to foreground notification events
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      const { pressAction, notification } = detail;

      addInfoLog(`[Notification Foreground Event] type: ${type}, notification ID: ${notification?.id}`);

      switch (type) {
        case EventType.PRESS:
          if (notification.id.startsWith(NOTIFICATION_ID.LATE_NO_MORE)) {
            addInfoLog("Late No More meeting opened via notification");
            navigationRef.current && navigationRef.current.navigate(NAVIGATION.LateNoMore);
          }
          await notifee.cancelNotification(notification.id);
          break;

        case EventType.ACTION_PRESS:
          if (pressAction?.id === NOTIFICATION_PRESS_ID.DISMISS_EVENT && notification?.data?.eventId) {
            addInfoLog("Late No More event dismissed via notification");
            LateNoMoreManager.cancelScheduledNotifications(true);
            dispatch(lateNoMoreDismissEvent(notification.data.eventId));
          }
          break;

        case EventType.DELIVERED:
          postHogCapture(POSTHOG_EVENT_NAMES.NOTIFICATION_RECEIVED, {
            notification_id: notification.id,
            notification_title: notification.title,
            notification_body: notification.body,
            notification_source: "local_notifee",
          });
          if (notification.title === t("notification.scheduleNotificationTitleForResumeRoutine")) {
            dispatch(setPostponeActivated(false));
            resumeBlockingSchedulesNativeMethod();
            await updateScheduleBlockingStatus();

          }
      }
    });

    notifee.setNotificationCategories([
      {
        id: NOTIFICATION_ID.LATE_NO_MORE,
        actions: [
          {
            id: NOTIFICATION_PRESS_ID.DISMISS_EVENT,
            title: t("lateNoMore.ignoreMeeting"),
          },
        ],
      },
    ]);

    return unsubscribe;
  }, []);

  useEffect(() => {
    const init = async () => {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      if (userId) {
        await Purchases.configure({
          apiKey: checkIsIOS() ? REVENUECAT_API_KEY_APPLE : REVENUECAT_API_KEY_GOOGLE,
          appUserID: userId,
        });
      }
    };
    init();
  }, []);

  // Set the app language
  useEffect(() => {
    // Use system language if app language is null
    const newLanguage = appLanguage || systemLanguage;
    i18n.changeLanguage(newLanguage);

    const locale = baseLanguages.find((base) => newLanguage.startsWith(base));
    // Safely set moment locale, fallback to 'en' if locale is not found or fails to load
    try {
      if (locale && moment.locales().includes(locale)) {
        moment.locale(locale);
      } else {
        moment.locale("en");
      }
    } catch (error) {
      // If locale setting fails, fallback to English
      moment.locale("en");
      addErrorLog("Failed to set moment locale", error);
    }
  }, [appLanguage]);

  const getReady = useCallback(async () => {
    BootSplash.hide({ fade: true });
    reactNavigationIntegration.registerNavigationContainer(navigationRef);
    routeNameRef.current = await getCurrentRoute();
  }, []);

  const onStateChange = useCallback(async () => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = await getCurrentRoute();
    if (previousRouteName !== currentRouteName) {
      routeNameRef.current = currentRouteName;
      notifyRouteChanged(currentRouteName);
      await trackScreenView(currentRouteName);
    }
  }, []);

  const handleLinkParticipantCode = async () => {
    if (participantCode) {
      await linkCode(participantCode);
    }
  };

  useEffect(() => {
    if (participantCode && accessToken) {
      handleLinkParticipantCode();
    }
  }, [accessToken, participantCode]);

  const isFirstAppOpenPostHogCaptured = useSelector((state) => state.global.isFirstAppOpenPostHogCaptured);

  useEffect(() => {
    if (!isFirstAppOpenPostHogCaptured) {
      postHogCapture(POSTHOG_EVENT_NAMES.USER_OPEN_THE_APP_FOR_THE_FIRST_TIME);
      dispatch(setFirstAppOpenPostHogCaptured(true));
    }
  }, [isFirstAppOpenPostHogCaptured, dispatch]);

  useEffect(() => {
    if (checkIsIOS() || preLoadedInstalledApps?.length > 0) {
      return;
    }

    let isCancelled = false;

    const preloadInstalledApps = async () => {
      const installedApps = await OverlayModule.getApps();
      if (isCancelled || !Array.isArray(installedApps) || installedApps.length === 0) {
        return;
      }

      const appsWithoutIcons = installedApps.map(({ icon: _icon, ...rest }) => rest);
      dispatch(preLoadInstalledApps(appsWithoutIcons));
    };

    preloadInstalledApps();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, dispatch, preLoadedInstalledApps]);

  return (
    <>
      <SystemBars style={appTheme === "light" ? "dark" : "light"} />
      <KeyboardProvider navigationBarTranslucent>
        <NavigationContainer
          linking={linking}
          theme={theme}
          onReady={getReady}
          ref={navigationRef}
          onStateChange={onStateChange}
        >
          <HomeContextProvider>
            <LauncherContextProvider>
              <GestureHandlerRootView>
                <MainComponent
                  {...{
                    accessToken,
                    isOnBoardingStatus,
                  }}
                />
                <AppMenuOverlay />
                <VerifyPasswordModal />
                <PostponeModal />
                <TaskModal />
                <StreakAnimation />
              </GestureHandlerRootView>
            </LauncherContextProvider>
          </HomeContextProvider>
          <Toast config={toastConfig} bottomOffset={100} position="bottom" />
        </NavigationContainer>
      </KeyboardProvider>
    </>
  );
}

const MainComponent = ({ accessToken, isOnBoardingStatus }) => {
  if (!accessToken) {
    return <AuthNavigator />;
  } else if (!isOnBoardingStatus) {
    return <OnBoardingNavigator />;
  } else {
    return <AppNavigator />;
  }
};

const trackScreenView = async (currentRouteName) => {
  const screenName = startCase(camelCase(currentRouteName)).replace(/\s/g, "");
  addInfoLog(`[Navigation] User navigated to screen: **${screenName}**`);

  // Emit event when navigating to BreathingExercise so launcher overlay can close
  if (currentRouteName === NAVIGATION.BreathingExercise) {
    DeviceEventEmitter.emit("onNavigateToBreathingExercise");
  }

  switch (currentRouteName) {
    case "AskForHelp":
      postHogCapture(POSTHOG_EVENT_NAMES.ASK_FOR_HELP);
      break;
    // if there are more cases, add them here
    default:
      break;
  }
};
