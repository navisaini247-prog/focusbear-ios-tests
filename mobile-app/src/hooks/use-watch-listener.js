import { WATCH_ACTIVITY } from "@/utils/Enums";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import { watchEvents } from "react-native-watch-connectivity";

const useWatchListener = ({ androidListenerCallback, iosListenerCallback }) => {
  useEffect(() => {
    let unsubscribe = null;
    if (checkIsIOS()) {
      unsubscribe = watchEvents.on(WATCH_ACTIVITY.MESSAGE, iosListenerCallback);
    } else {
      DeviceEventEmitter.addListener(WATCH_ACTIVITY.SEND_DATA_TO_RN, androidListenerCallback);
    }
    return () => {
      if (checkIsIOS()) {
        unsubscribe();
      } else {
        DeviceEventEmitter.removeAllListeners(WATCH_ACTIVITY.SEND_DATA_TO_RN);
      }
    };
  }, []);
};

export { useWatchListener };
