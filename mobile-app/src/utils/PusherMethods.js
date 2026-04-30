import { getApp } from "@react-native-firebase/app";
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  hasPermission,
  isDeviceRegisteredForRemoteMessages,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from "@react-native-firebase/messaging";
import { APIURLS } from "@/utils/ApiUrls";
import { APIMethod } from "@/utils/ApiMethod";
import { store } from "@/store";
import { pusherActivityCompleted } from "@/actions/ActivityActions";
import { POSTHOG_EVENT_NAMES } from "./Enums";
import { logSentryError, postHogCapture } from "./Posthog";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { addErrorLog, addInfoLog } from "./FileLogger";
import { isEmpty } from "lodash";
import DeviceInfo from "react-native-device-info";
const firebaseMessaging = getMessaging(getApp());
let hasInitializedPushRegistration = false;
let currentPushUserId = null;
let tokenRefreshUnsubscribe = null;
let hasTokenRefreshListener = false;


const registerPushToken = async (fcmToken) => {
  if (!fcmToken) {
    return;
  }

  const installationId = await DeviceInfo.getUniqueId();
  const appVersion = `${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`;

  const state = store.getState();
  const deviceId = state?.user?.deviceData?.id;
  const accessToken = state?.user?.accessToken;

  if (!accessToken || !deviceId) {
    addInfoLog("Skipping FCM push registration: missing access token or device id");
    return;
  }

  await APIMethod({
    endpoint: APIURLS.devicePushRegistration,
    method: "PUT",
    body: {
      installation_id: installationId,
      device_id: deviceId,
      operating_system: checkIsAndroid() ? "Android" : "iOS",
      app_version: appVersion,
      token: fcmToken,
      provider: "fcm",
    },
  });
};

const registerTokenRefreshListener = () => {
  if (hasTokenRefreshListener) {
    return;
  }

  tokenRefreshUnsubscribe = onTokenRefresh(firebaseMessaging, async (nextToken) => {
    try {
      const latestAuthStatus = await hasPermission(firebaseMessaging);
      const isPushAllowed =
        latestAuthStatus === AuthorizationStatus.AUTHORIZED || latestAuthStatus === AuthorizationStatus.PROVISIONAL;

      if (!isPushAllowed) {
        await disconnectPushNotifications();
        return;
      }

      await registerPushToken(nextToken);
      addInfoLog("FCM token refreshed and registered successfully");
    } catch (error) {
      addErrorLog("FCM token refresh registration error: ", error);
      logSentryError(error);
    }
  });
  hasTokenRefreshListener = true;
};

const initializePushNotifications = async (userId) => {
  try {
    if (!userId) {
      return;
    }

    const authStatus = await hasPermission(firebaseMessaging);
    const isPushAllowed =
      authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
    if (!isPushAllowed) {
      addInfoLog("Skipping FCM setup because notification permission is not granted");
      if (hasInitializedPushRegistration || currentPushUserId) {
        await disconnectPushNotifications();
      }
      return;
    }

    if (!isDeviceRegisteredForRemoteMessages(firebaseMessaging)) {
      await registerDeviceForRemoteMessages(firebaseMessaging);
    }

    const fcmToken = await getToken(firebaseMessaging);
    await registerPushToken(fcmToken);

    addInfoLog("FCM token registered successfully");

    registerTokenRefreshListener();

    currentPushUserId = userId;
    hasInitializedPushRegistration = true;
  } catch (e) {
    addErrorLog("initializePushNotifications ERROR: ", e);
    logSentryError(e);
  }
};

const disconnectPushNotifications = async () => {
  try {
    if (tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe();
      tokenRefreshUnsubscribe = null;
    }
    hasTokenRefreshListener = false;

    const state = store.getState();

    if (!state?.user?.accessToken) {
      addInfoLog("Skipping push deregistration API: no access token");
      hasInitializedPushRegistration = false;
      currentPushUserId = null;
      return;
    }

    const installationId = await DeviceInfo.getUniqueId();

    await APIMethod({
      endpoint: APIURLS.devicePushRegistration,
      method: "DELETE",
      body: {
        installation_id: installationId,
        provider: "fcm",
      },
    });

    hasInitializedPushRegistration = false;
    currentPushUserId = null;
    addInfoLog("Push token deregistered successfully");
  } catch (e) {
    addErrorLog("disconnectPushNotifications ERROR: ", e);
    logSentryError(e);
  }
};

export const handleNotification = (notification) => {
  if (isEmpty(notification)) {
    return;
  }

  const notificationData = notification?.data ? notification.data : {};

  const normalizedNotification = {
    ...notificationData,
    ...notification,
    title: notification?.title || notification?.notification?.title,
    body: notification?.body || notification?.notification?.body,
    id: notification?.id || notification?.messageId || notification?.notification_id,
  };

  postHogCapture(POSTHOG_EVENT_NAMES.NOTIFICATION_RECEIVED, {
    notification_id: normalizedNotification.id,
    notification_title: normalizedNotification.title,
    notification_body: normalizedNotification.body,
    notification_source: "firebase_fcm",
  });

  store.dispatch(pusherActivityCompleted(normalizedNotification));
};

export {
  initializePushNotifications,
  disconnectPushNotifications,
};
