import React, { useEffect, useMemo, useRef, useState } from "react";
import { completeActivityAPI } from "@/actions/ActivityActions";
import { AppHeader, BodyMediumText, Button, DisplaySmallText } from "@/components";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { NAVIGATION, ROUTINE_NAMES } from "@/constants";
import { useTranslation } from "react-i18next";
import { hideFloatingView, sendDataToWatchApp } from "@/utils/NativeModuleMethods";
import { convertSecToMins } from "@/utils/TimeMethods";
import { rotateLeft } from "@/utils/GlobalMethods";
import { StackActions, useNavigation } from "@react-navigation/native";
import { AppState, Linking, StyleSheet, View, TouchableOpacity } from "react-native";
import { useDispatch } from "react-redux";
import { NOTIFICATION_ID, NOTIFICATION_PRESS_ID, TAKE_LOGS, WATCH_COMMAND, WATCH_ACTIVITY } from "@/utils/Enums";
import { useWatchListener } from "@/hooks/use-watch-listener";
import { LogQuantity } from "./components/LogQuantity";
import { AddNote } from "./components/AddNote";
import { displayNotification } from "../Notification";
import { addInfoLog } from "@/utils/FileLogger";
import { FOCUSBEAR_APP_HOME_URL_SCHEME } from "@/constants/AppURLScheme";
import SkippedModal from "@/screens/Complete/SkippedScreen";
import { useHomeContext } from "../Home/context";
import { useIsMorningOrEvening } from "@/hooks/use-current-routine-name";
import { ACTIVITY_TYPE } from "@/constants/routines";

function CompleteScreen({ route }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [showSkipModal, setShowSkipModal] = useState(false);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const dispatch = useDispatch();

  const isEveningTime = useIsMorningOrEvening() === ROUTINE_NAMES.EVENING;
  const { routineData } = useHomeContext();

  const { item, savedNoteText = "", didAlready } = route?.params || {};

  const titleName = item?.name;

  const currentRoutine = useMemo(() => {
    return routineData.find((routine) => routine.activity_sequence_id === item.activity_sequence_id);
  }, [routineData, item]);

  const listData = useMemo(() => currentRoutine?.activities || [], [currentRoutine]);

  const nextItem = useMemo(() => {
    // Find the next uncompleted activity after the current one. Still succeeds if findIndex returns -1
    const currentIndex = listData.findIndex((_activity) => _activity.id === item.id);
    return rotateLeft(listData, currentIndex + 1).find(
      (activity) => activity.isAvailable && !activity.isCompleted && !activity.isLocked,
    );
  }, [listData, item]);

  const isFreemiumLimitReached = useMemo(() => {
    const remainingActivities = listData.filter((activity) => !activity.isCompleted);
    return remainingActivities.length > 0 && remainingActivities.every((activity) => activity.isLocked);
  }, [listData]);

  const hasTakeNotes = item?.take_notes === TAKE_LOGS.END_OF_ACTIVITY;
  const richTextRef = useRef(null);
  const [noteText, setNoteText] = useState(savedNoteText);

  const hasLogQuantity = item?.log_quantity;
  const logQuantityQuestions = item?.log_quantity_questions ?? [];
  const [logQuantityError, setLogQuantityError] = useState({});
  const [logQuantityAnswers, setLogQuantityAnswers] = useState(() =>
    Object.fromEntries(
      logQuantityQuestions.map((item) => [item.id, { question_id: item.id, logged_value: item.min_value ?? "" }]),
    ),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        addInfoLog("App has come to the foreground!");
        hideFloatingView();
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      addInfoLog("AppState", appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const iosListenerCallback = (message) => {
    if (message?.sendDataToRN === t("common.next") && nextItem) {
      sendDataToWatchApp({
        text: nextItem,
        DATA_TYPE: WATCH_COMMAND.SET_ACTIVITY_OUT_OF_ORDER,
      });
    } else if (message?.sendDataToRN === t("home.start")) {
      onButtonPressMethod();
    }
  };

  const androidListenerCallback = (value) => {
    if (value[WATCH_ACTIVITY.MESSAGE] === t("common.next") && nextItem) {
      sendDataToWatchApp({
        text: nextItem,
        DATA_TYPE: WATCH_COMMAND.SET_ACTIVITY_OUT_OF_ORDER,
      });
    } else if (value[WATCH_ACTIVITY.MESSAGE] === t("home.start")) {
      onButtonPressMethod();
    }
  };

  useWatchListener({
    androidListenerCallback,
    iosListenerCallback,
  });

  useEffect(() => {
    if (appStateVisible === "background") {
      showPushNotificationForActivityCompletion();
    }
    hideFloatingView();

    // Send "continue on your phone" message to watch if this is a log quantity habit
    if (item?.log_quantity) {
      sendDataToWatchApp({
        DATA_TYPE: WATCH_COMMAND.SET_ACTIVITY_CONTINUE_ON_YOUR_PHONE,
      });
    }
  }, []);

  const showPushNotificationForActivityCompletion = async () => {
    if (nextItem) {
      displayNotification({
        id: NOTIFICATION_ID.ROUTINE,
        title: t("notification.floatingModuleActivityCompleteNotificationtitle"),
        body: `${titleName} finished. Next up is ${nextItem?.name}`,
        pressActionId: NOTIFICATION_PRESS_ID.ACTIVITY_COMPLETED,
      });
    } else {
      const routineCompletedDescription =
        currentRoutine.type === ACTIVITY_TYPE.EVENING
          ? t("notification.eveningRoutineCompletedNotificationDescription")
          : currentRoutine.type === ACTIVITY_TYPE.MORNING
            ? t("notification.floatingModuleSystemUnlockedNotification")
            : t("notification.customRoutineCompletedNotificationDescription", { routineName: currentRoutine.name });

      displayNotification({
        id: NOTIFICATION_ID.ROUTINE,
        title: t("notification.floatingModuleRoutineCompleteNotificationtitle"),
        body: routineCompletedDescription,
        pressActionId: NOTIFICATION_PRESS_ID.ROUTINE_COMPLETED,
        deeplink: FOCUSBEAR_APP_HOME_URL_SCHEME,
      });

      // This will open the app on homescreen when last activity is completed and user come back to app from recent menu.
      const supported = await Linking.canOpenURL(FOCUSBEAR_APP_HOME_URL_SCHEME);

      if (supported) {
        await Linking.openURL(FOCUSBEAR_APP_HOME_URL_SCHEME);
      } else {
        navigation.dispatch(StackActions.replace(NAVIGATION.TabNavigator));
      }
    }
  };

  const buttonText = useMemo(() => {
    if (nextItem) {
      const { duration_seconds, name: activityName } = nextItem;

      if (nextItem.completion_requirements) {
        return t("common.startActivity", { activityName });
      }

      const isLessThanAMinute = duration_seconds < 60;
      const time = isLessThanAMinute ? duration_seconds : convertSecToMins(duration_seconds, false);
      const unit = isLessThanAMinute ? t("home.secs") : t("home.mins");

      return t("common.startTimerActivity", { time, unit, activityName });
    }

    return isEveningTime ? t("complete.backToHome") : t("focusMode.startFocusSession");
  }, [nextItem, isEveningTime, t]);

  const onButtonPressMethod = async () => {
    if (hasLogQuantity || hasTakeNotes) {
      const hasError = Object.values(logQuantityError).length > 0;
      const logQuantity = hasError ? [] : Object.values(logQuantityAnswers);
      await dispatch(completeActivityAPI(item, logQuantity, noteText));
    }

    if (nextItem) {
      onActivityPress();
    } else if (isEveningTime) {
      navigation.replace(NAVIGATION.TabNavigator);
    } else {
      navigation.popTo(NAVIGATION.TabNavigator, { screen: NAVIGATION.Focus });
    }
  };

  const onActivityPress = async () => {
    sendDataToWatchApp({ text: nextItem, DATA_TYPE: WATCH_COMMAND.SET_ACTIVITY_OUT_OF_ORDER });
    navigation.dispatch(StackActions.replace(NAVIGATION.RoutineDetail, { item: nextItem }));
  };

  const headingText = useMemo(() => {
    if (didAlready) {
      return `${titleName} ${t("complete.finishedCheck")}`;
    }
    if (nextItem) {
      return `${titleName} ${t("complete.habitNotCompleted")}`;
    }
    return `${titleName} ${
      isEveningTime ? t("complete.finishedAndEarnedEvening") : t("complete.finishedAndEarnedMorning")
    }`;
  }, [didAlready, nextItem, titleName, isEveningTime, t]);

  return (
    <View style={styles.flex}>
      <AppHeader title={t("home.completed")} />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <DisplaySmallText center>{headingText}</DisplaySmallText>

        {isFreemiumLimitReached && <BodyMediumText>{t("home.habitLimitMessage")}</BodyMediumText>}

        {hasLogQuantity && (
          <LogQuantity
            logQuantity={logQuantityQuestions}
            logQuantityAnswers={logQuantityAnswers}
            setLogQuantityAnswers={setLogQuantityAnswers}
            error={logQuantityError}
            setError={setLogQuantityError}
          />
        )}

        {hasTakeNotes && <AddNote richTextRef={richTextRef} noteText={noteText} setNoteText={setNoteText} />}

        <View style={styles.gap24}>
          <Button
            primary
            testID="test:id/press-activity-complete-button"
            onPress={onButtonPressMethod}
            title={buttonText}
          />

          {nextItem && (
            <TouchableOpacity onPress={() => setShowSkipModal(true)} testID="test:id/skip-habit">
              <BodyMediumText center underline>
                {t("home.skipHabitDesc")}
              </BodyMediumText>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAwareScrollView>

      <SkippedModal isVisible={showSkipModal} onClose={() => setShowSkipModal(false)} activity={nextItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap24: { gap: 24 },
  contentContainer: {
    flexGrow: 1,
    gap: 48,
    padding: 24,
    paddingVertical: 48,
    justifyContent: "center",
  },
});

export default CompleteScreen;
