import "./wdyr";

import App from "@/App";
import { AppRegistry, Linking, LogBox } from "react-native";
import "react-native-gesture-handler";
import notifee, { EventType } from "@notifee/react-native";
import { getApp } from "@react-native-firebase/app";
import { getMessaging, onMessage, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import { handleNotification } from "@/utils/PusherMethods";
import { NOTIFICATION_ID, NOTIFICATION_PRESS_ID, POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { setPostponeActivated } from "@/actions/GlobalActions";
import { store } from "@/store";
import { name as appName } from "./app.json";
import { addInfoLog } from "@/utils/FileLogger";
import { postHogCapture } from "@/utils/Posthog";
import LateNoMoreManager from "@/controllers/LateNoMoreManager";
import { lateNoMoreDismissEvent } from "@/actions/UserActions";
import { resumeBlockingSchedulesNativeMethod, updateScheduleBlockingStatus } from "@/utils/NativeModuleMethods";
import "intl-pluralrules";
import "@/localization/i18n";

LogBox.ignoreAllLogs();
const firebaseMessaging = getMessaging(getApp());

notifee.registerForegroundService((_notification) => {
  return new Promise(() => {
    notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction.id === NOTIFICATION_PRESS_ID.FOREGROUND_SERVICE) {
        addInfoLog("App Opened from foreground notification and stopped foreground notification");
      }
    });
  });
});

// Delete notification channels we no longer use
notifee.deleteChannel("focus_bear");
notifee.deleteChannel("FOCUS_BEAR");
notifee.deleteChannel("FOCUS_BEAR_FOREGROUND");

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  addInfoLog(`[Notification Background Event] type: ${type}, notification ID: ${notification?.id}`);

  // Track notification received event
  if (type === EventType.DELIVERED) {
    postHogCapture(POSTHOG_EVENT_NAMES.NOTIFICATION_RECEIVED, {
      notification_id: notification.id,
      notification_title: notification.title,
      notification_body: notification.body,
      notification_source: "local_notifee",
    });
  }

  if (pressAction?.id === NOTIFICATION_PRESS_ID.ROUTINE_COMPLETED) {
    addInfoLog("Unlock Notification from floatingModule");
    Linking.openURL(notification?.data?.deeplink);
  } else if (pressAction?.id === NOTIFICATION_PRESS_ID.ACTIVITY_COMPLETED) {
    addInfoLog("activity completed from floatingModule");
  } else if (pressAction?.id === NOTIFICATION_PRESS_ID.RESUME_ROUTINE) {
    addInfoLog("postpost finished");
    store.dispatch(setPostponeActivated(false));
    resumeBlockingSchedulesNativeMethod();
    await updateScheduleBlockingStatus();
  } else if (pressAction?.id === NOTIFICATION_PRESS_ID.DISMISS_EVENT && notification?.data?.eventId) {
    addInfoLog("Late No More event dismissed via notification");
    LateNoMoreManager.cancelScheduledNotifications(true);
    store.dispatch(lateNoMoreDismissEvent(notification.data.eventId));
  }

  if (type === EventType.PRESS) {
    if (notification.id.startsWith(NOTIFICATION_ID.LATE_NO_MORE) && notification?.data?.deeplink) {
      addInfoLog("Late No More meeting opened via notification");
      Linking.openURL(notification.data.deeplink);
    }

    // Remove the notification
    await notifee.cancelNotification(notification.id);
  }
});

setBackgroundMessageHandler(firebaseMessaging, async (remoteMessage) => {
  handleNotification(remoteMessage);
});

onMessage(firebaseMessaging, async (remoteMessage) => {
  handleNotification(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerHeadlessTask("LateNoMoreTask", () => async () => {
  await LateNoMoreManager.checkUpcomingMeetings();
});
