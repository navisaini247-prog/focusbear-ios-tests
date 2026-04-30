import notifee, { TriggerType, AndroidLaunchActivityFlag, AndroidVisibility, AlarmType } from "@notifee/react-native";
import { NOTIFICATION_CHANNELS, NOTIFICATION_ID } from "@/utils/Enums";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { addInfoLog } from "@/utils/FileLogger";

// For simplicity, channel ids and notification ids are the same

export const displayNotification = async ({ id, title, body, deeplink, asForegroundService, pressActionId }) => {
  const channel = NOTIFICATION_CHANNELS[id];

  const channelId = await notifee.createChannel({
    id,
    name: channel.NAME,
    importance: channel.IMPORTANCE,
    sound: "default", // Use system default notification sound
    vibration: true, // Enable vibration
  });

  await notifee.displayNotification({
    id,
    title,
    body,
    data: {
      // Values must be strings
      deeplink: deeplink || "",
    },
    android: {
      channelId,
      asForegroundService: asForegroundService || false,
      importance: channel.IMPORTANCE,
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: "ic_launcher_round",
      largeIcon: "ic_launcher_round",
      sound: "default", // Use system default notification sound
      pressAction: {
        // Will open app when user clicks on notification
        id: pressActionId || id,
        launchActivity: "default",
        launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
      },
    },
    ios: {
      sound: "default", // Use system default notification sound
    },
  });
};

export const createTriggerNotification = async ({
  id,
  timestamp,
  title,
  body,
  deeplink,
  pressActionId,
  data,
  android,
  ios,
  rest,
}) => {
  // For Late No More stage notifications, extract the base notification ID for channel lookup
  let channelId = id.startsWith(NOTIFICATION_ID.LATE_NO_MORE) ? NOTIFICATION_ID.LATE_NO_MORE : id;
  const channel = NOTIFICATION_CHANNELS[channelId];

  addInfoLog(
    `[createTriggerNotification] Creating ${id} notification scheduled for: ${new Date(timestamp).toLocaleString()}`,
  );

  channelId = await notifee.createChannel({
    id: channelId,
    name: channel.NAME,
    importance: channel.IMPORTANCE,
    sound: "default", // Enable notification sound
  });

  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp,
    // Android-specific: Use exact alarms for precise timing
    // AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE ensures the alarm fires even in Doze mode
    ...(checkIsAndroid() && {
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
        allowWhileIdle: true,
      },
    }),
  };

  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      data: {
        // Values must be strings
        deeplink: deeplink || "",
        ...data,
      },
      android: {
        channelId,
        importance: channel.IMPORTANCE,
        visibility: AndroidVisibility.PUBLIC,
        smallIcon: "ic_launcher_round",
        largeIcon: "ic_launcher_round",
        ...android,
        pressAction: {
          id: pressActionId || id,
          launchActivity: "default",
          launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
          ...android?.pressAction,
        },
      },
      ios: {
        sound: "default",
        ...ios,
      },
      ...rest,
    },
    trigger,
  );
};

export const cancelNotification = async (id) => await notifee.cancelNotification(id);

export const cancelAllNotifications = async () => await notifee.cancelAllNotifications();
