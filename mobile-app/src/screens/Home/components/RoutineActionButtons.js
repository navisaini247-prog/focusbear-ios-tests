import { useCallback, useEffect } from "react";
import { NAVIGATION } from "@/constants";
import { useTranslation } from "react-i18next";
import { WATCH_COMMAND, APPLE_WATCH_ACTIVITY, WATCH_ACTIVITY } from "@/utils/Enums";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { useWatchListener } from "@/hooks/use-watch-listener";
import { sendDataToWatchApp } from "@/utils/NativeModuleMethods";
import { getCurrentActivityProps } from "@/actions/UserActions";
import { onActivityStart } from "@/actions/ActivityActions";

export const useRoutineWatchIntegration = ({ nextActivity: nextItem }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      if (nextItem) {
        sendDataToWatchApp({
          text: nextItem,
          DATA_TYPE: WATCH_COMMAND.SET_ACTIVITY_AT_START_OF_ROUTINE,
        });
      }
    }
  }, [isFocused, nextItem]);

  const playNextActivity = useCallback(() => {
    navigation.navigate(NAVIGATION.RoutineDetail, { item: nextItem });
    onActivityStart(nextItem);
  }, [nextItem, navigation]);

  const handleStartRoutinePressed = useCallback(() => {
    dispatch(getCurrentActivityProps());
    playNextActivity();
  }, [dispatch, playNextActivity]);

  const iosListenerCallback = useCallback(
    (message) => {
      if (
        message?.sendDataToRN == t("home.start") ||
        message?.sendDataToRN == APPLE_WATCH_ACTIVITY.ACTIVITY_START_WITH_LOG_QUANTITY
      ) {
        handleStartRoutinePressed();
      } else if (message?.sendDataToRN == APPLE_WATCH_ACTIVITY.ROUTINE_HAS_BEEN_POSTPONED) {
        if (nextItem) {
          sendDataToWatchApp({
            text: nextItem,
            DATA_TYPE: WATCH_COMMAND.SET_ACTIVITY_OUT_OF_ORDER,
          });
        }
      }
    },
    [handleStartRoutinePressed, nextItem, t],
  );

  const androidListenerCallback = useCallback(
    (value) => {
      if (
        value[WATCH_ACTIVITY.MESSAGE] == t("home.start") ||
        value[WATCH_ACTIVITY.MESSAGE] == APPLE_WATCH_ACTIVITY.ACTIVITY_START_WITH_LOG_QUANTITY
      ) {
        handleStartRoutinePressed();
      } else if (value[WATCH_ACTIVITY.MESSAGE] == APPLE_WATCH_ACTIVITY.ROUTINE_HAS_BEEN_POSTPONED) {
        if (nextItem) {
          sendDataToWatchApp({
            text: nextItem,
            DATA_TYPE: WATCH_COMMAND.SET_ACTIVITY_AT_START_OF_ROUTINE,
          });
        }
      }
    },
    [handleStartRoutinePressed, nextItem, t],
  );

  useWatchListener({
    androidListenerCallback,
    iosListenerCallback,
  });
};
