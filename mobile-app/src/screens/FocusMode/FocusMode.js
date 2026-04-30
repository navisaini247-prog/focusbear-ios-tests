import { InteractionManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useRoute, useTheme } from "@react-navigation/native";
import { AppHeader, Button, ConfirmationModal } from "@/components";
import { useTranslation } from "react-i18next";
import { styles } from "./FocusMode.styles";
import { ExitFocusingModal } from "./ExitFocusingModal";
import { useDispatch, useSelector } from "react-redux";
import {
  changeFocusModeState,
  finishFocusMode,
  hideFocusModeToolTip,
  setFocusModeNotes,
  setFocusDuration,
  startFocusMode,
} from "@/actions/FocusModeActions";
import { callAction } from "../../store/index";

import {
  completingFocusBlockSelector,
  currentFocusModeFinishTimeSelector,
  restrictedAppsListTypeSelector,
  hasDoneDailyFocusSessionSelector,
  hasCompletedFocusModeFirstTimeSelector,
} from "@/selectors/UserSelectors";
import { useNavigation } from "@react-navigation/native";
import {
  getCurrentActivityProps,
  setFocusModeFinishTime,
  setHasDoneDailyFocusSession,
  setHasCompletedFocusModeFirstTime,
} from "@/actions/UserActions";

import { formatDuration, getTimeDifference } from "@/utils/TimeMethods";
import { useAppActiveState } from "@/hooks/use-app-active-state";
import { isEmpty } from "lodash";
import { useCreateFocusMode } from "@/hooks/use-create-focus-mode";
import {
  allowedAppSelectionStatusSelector,
  blockedAppSelectionStatusSelector,
  isFocusSuperStrictModeSelector,
} from "@/selectors/GlobalSelectors";
import { FOCUS_TYPE, NOTIFICATION_ID, POSTHOG_EVENT_NAMES, RESTRICTED_APPS_LIST_TYPE } from "@/utils/Enums";
import { useHideFocusToolTip } from "./hooks/useHideFocusToolTip";
import { withAfterAnimation } from "@/hooks/with-after-animation";
import { focusModeNotesSelector } from "@/reducers/FocusModeReducer";
import { postHogCapture } from "@/utils/Posthog";
import { cancelNotification, createTriggerNotification } from "../Notification";
import { addErrorLog } from "@/utils/FileLogger";
import StartFocusing from "./StartFocusing";
import Focusing from "./Focusing";
import FinishFocusing from "./FinishFocusing";
import { ModifyFocusSessionModal } from "./ModifyFocusSessionModal";
import { setIsFocusSuperStrictMode, updateFocusModeScheduledFinish } from "@/actions/FocusModeActions";
import { checkIsFocusLimitExceeded, showFreemiumAlert } from "@/hooks/use-is-freemium";
import { NAVIGATION } from "@/constants";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { useHomeContext } from "../Home/context";
import useCheckBlockedAppsStatus from "@/hooks/use-check-allowed-blocked-apps";
import { setOnboardingFocusSessionFlag } from "@/actions/GlobalActions";
import { TYPES } from "@/actions/ActivityActions";

const FocusState = {
  START: "START_FOCUSING",
  FOCUSING: "FOCUSING",
  CONGRATS: "CONGRATS",
  FINISH_FOCUSING: "FINISH_FOCUSING",
};

const LENGTH_OF_RANDOM_MESSAGES = 9;
export const DEFAULT_FOCUS_MINUTES = 25;

export const FocusMode = withAfterAnimation(() => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const fromInduction = useRoute().params?.fromInduction;

  const { allBlockingPermissionsGranted } = useHomeContext();
  useCheckBlockedAppsStatus();

  const isSuperStrictMode = useSelector(isFocusSuperStrictModeSelector);
  const { focusModesList } = useSelector((state) => state.focusMode);
  const focusNotes = useSelector(focusModeNotesSelector);

  const currentFocusModeFinishTime = useSelector(currentFocusModeFinishTimeSelector);
  const completingFocusBlock = useSelector(completingFocusBlockSelector);

  const restrictedAppsListType = useSelector(restrictedAppsListTypeSelector);
  const hasUserSelectedBlockedApps = useSelector(blockedAppSelectionStatusSelector);
  const hasUserSelectedAllowedApps = useSelector(allowedAppSelectionStatusSelector);

  const isAnyAppSelectedOnAndroid =
    restrictedAppsListType === RESTRICTED_APPS_LIST_TYPE.ALLOW_LIST
      ? hasUserSelectedAllowedApps
      : hasUserSelectedBlockedApps;

  const isAnyAppSelectedOnIOS = hasUserSelectedBlockedApps;

  const shouldShowWarningForBlockedApps = checkIsAndroid() ? !isAnyAppSelectedOnAndroid : !isAnyAppSelectedOnIOS;

  const [focusTime, setFocusTime] = useState(new Date(DEFAULT_FOCUS_MINUTES * 60 * 1000));
  const [isBlockingWarningVisible, setIsBlockingWarningVisible] = useState(false);
  const [focusStartTime, setFocusStartTime] = useState(new Date());
  const [focusFinishTime, setFocusFinishTime] = useState(new Date());

  const [focusState, setFocusState] = useState(FocusState.START);
  const isFocusing = focusState === FocusState.FOCUSING;

  const [achievedInput, setAchievedInput] = useState("");
  const [distractionInput, setDistractionInput] = useState("");
  const [isSuperStrict, setIsSuperStrict] = useState(isSuperStrictMode || false);

  const [congratsMessage, setCongratsMessage] = useState("");
  const [totalFocusedTime, setTotalFocusedTime] = useState(0);

  const [openEndSessionEarlyModal, setOpenEndSessionEarlyModal] = useState(false);
  const [isExtendModalVisible, setIsExtendModalVisible] = useState(false);

  useHideFocusToolTip();
  useCreateFocusMode();

  // Executes when tab is focused
  useFocusEffect(
    useCallback(() => {
      // Get current-activity-props and hide running focusmode tooltip

      dispatch(getCurrentActivityProps());

      callAction(hideFocusModeToolTip());
    }, []),
  );

  // Synchronize focus state with other devices
  useAppActiveState(() => dispatch(getCurrentActivityProps()));
  useEffect(() => {
    const isFocusingOnAnotherDevice = Boolean(currentFocusModeFinishTime);
    if (isFocusingOnAnotherDevice) {
      const newFocusFinishTime = new Date(currentFocusModeFinishTime);
      const newFocusTime = new Date(newFocusFinishTime.getTime() - Date.now());

      if (newFocusTime.getTime() < 0) {
        return;
      } // Make sure newFocusFinishTime is in the future

      if (!isFocusing) {
        // If focusing on another device but not locally, start focus mode
        onStartFocus(false, newFocusTime);
      } else {
        // If focusing locally, update focus time if the difference > 10 seconds
        const newFocusTimeDifference = new Date(newFocusTime.getTime() - focusTime.getTime());
        if (Math.abs(newFocusTimeDifference.getTime()) > 10000) {
          addTimeToFocus(newFocusTimeDifference);
        }
      }
    } else if (isFocusing) {
      // If not focusing on another device and is focusing locally, stop focus mode
      onEndFocusEarly(false);
    }
  }, [currentFocusModeFinishTime]);

  const getDefaultFocusMode = () => {
    if (isEmpty(focusModesList)) {
      return;
    }

    const defaultFocusMode = focusModesList.find(
      (focusMode) =>
        focusMode.metadata &&
        focusMode.metadata.isDefault === true &&
        focusMode.name === t("home.blockSuperDistractingApps"),
    );

    if (!defaultFocusMode || !defaultFocusMode.id) {
      return null;
    }

    return defaultFocusMode.id;
  };

  const onStartFocus = async (postThisEvent = true, focusTimeOverride) => {
    const newFocusTime = focusTimeOverride ?? focusTime;

    if (!focusTimeOverride && checkIsFocusLimitExceeded(newFocusTime)) {
      return showFreemiumAlert(t("focus.focusLimitReachedTitle"), t("focus.focusLimitReachedMessage"), navigation);
    }

    // Wait until after UI interactions are complete, then check for screentime permissions
    InteractionManager.runAfterInteractions(() => {
      // Use timePickerRef to always get the latest time picker value, unless focusTimeOverride is provided
      if (newFocusTime.getTime() <= 0) {
        return;
      }

      // Generate a random congrats message
      setCongratsMessage(() => {
        const messages = "focusMode.postFocusCongrats_";
        const randomIndex = Math.floor(Math.random() * LENGTH_OF_RANDOM_MESSAGES);
        return t(messages + randomIndex);
      });

      // Calculate start and finish time
      const newFinishTime = new Date(Date.now() + newFocusTime.getTime());
      setFocusFinishTime(newFinishTime);
      setTotalFocusedTime(newFocusTime.getTime());
      const finishTimeISO = newFinishTime.toISOString();

      const newStartTime = new Date();
      setFocusStartTime(newStartTime);
      const startTimeISO = newStartTime.toISOString();

      // Dispatch!!
      if (postThisEvent) {
        const defaultFocusModeId = getDefaultFocusMode();
        const intention = focusNotes?.intention || completingFocusBlock?.intention || "";
        dispatch(setIsFocusSuperStrictMode(isSuperStrict));
        if (defaultFocusModeId) {
          dispatch(startFocusMode(defaultFocusModeId, startTimeISO, finishTimeISO, intention));
        }
        postHogCapture(POSTHOG_EVENT_NAMES.START_FOCUS_MODE_MANUALLY);
      }

      dispatch(
        setFocusModeNotes({
          ...focusNotes,
          intention: focusNotes?.intention || completingFocusBlock?.intention || "",
          thought: "",
        }),
      );
      dispatch(changeFocusModeState(true));
      setFocusState(FocusState.FOCUSING);

      // Store the focus duration in Redux for native module access
      dispatch(setFocusDuration({ hours: newFocusTime.getUTCHours(), minutes: newFocusTime.getUTCMinutes() }));
    });
  };

  const onButtonEndSessionEarlyPressed = () => {
    setOpenEndSessionEarlyModal(true);
  };

  // Function to get the total focused time string from start to finish
  // Uses totalFocusedTime which is set on start and updated when extending
  const getTotalFocusedTimeString = useCallback(() => {
    const totalMs = Math.max(0, totalFocusedTime);

    const totalSeconds = Math.floor(totalMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Round up by a minute if seconds >= 30
    let roundedMinutes = minutes;
    if (remainingSeconds >= 30 || (!hours && !minutes)) {
      roundedMinutes += 1;
    }

    return formatDuration(hours, roundedMinutes);
  }, [totalFocusedTime]);

  const hasDoneDailyFocusSession = useSelector(hasDoneDailyFocusSessionSelector);
  const hasCompletedFocusModeFirstTime = useSelector(hasCompletedFocusModeFirstTimeSelector);

  const onFocusDone = useCallback(async () => {
    dispatch(setOnboardingFocusSessionFlag(true));
    dispatch(setIsFocusSuperStrictMode(false));
    setIsSuperStrict(false);
    dispatch(changeFocusModeState(false));
    dispatch(setFocusModeFinishTime(null));
    dispatch(setFocusDuration({ hours: 0, minutes: 0 }));
    setOpenEndSessionEarlyModal(false);

    if (!hasDoneDailyFocusSession) {
      dispatch(setHasDoneDailyFocusSession());
      dispatch({ type: TYPES.INCREMENT_FOCUS_STREAK });
    }

    if (!hasCompletedFocusModeFirstTime) {
      dispatch(setHasCompletedFocusModeFirstTime());
    }

    setFocusState(FocusState.CONGRATS);
  }, [dispatch, hasDoneDailyFocusSession, hasCompletedFocusModeFirstTime]);

  const onEndFocusEarly = async (postThisEvent = true) => {
    dispatch(setIsFocusSuperStrictMode(false));
    dispatch(changeFocusModeState(false));
    dispatch(setFocusModeFinishTime(null));
    dispatch(setFocusDuration({ hours: 0, minutes: 0 }));

    if (postThisEvent) {
      const defaultFocusModeId = getDefaultFocusMode();
      const currentFinishTime = new Date();
      const currentFinishTimeISO = currentFinishTime.toISOString();
      const focusDurationSeconds = getTimeDifference(focusStartTime, currentFinishTime, "seconds");
      if (defaultFocusModeId) {
        dispatch(
          finishFocusMode(
            defaultFocusModeId,
            currentFinishTimeISO,
            achievedInput,
            distractionInput,
            focusDurationSeconds,
          ),
        );
      }

      const durationInMinutes = getTimeDifference(focusStartTime, focusFinishTime);
      const properties = { focusDurationMinutes: durationInMinutes, "focus-type": FOCUS_TYPE.MOBILE_FOCUS };
      postHogCapture(POSTHOG_EVENT_NAMES.COMPLETED_FOCUS_SESSION, properties);

      // Update streak when session is completed
      if (!hasDoneDailyFocusSession) {
        dispatch(setHasDoneDailyFocusSession());

        dispatch({ type: TYPES.INCREMENT_FOCUS_STREAK });
      }

      // Mark first-time completion
      if (!hasCompletedFocusModeFirstTime) {
        dispatch(setHasCompletedFocusModeFirstTime());
      }
    }

    setFocusState(FocusState.START);
    setFocusTime(new Date(DEFAULT_FOCUS_MINUTES * 60 * 1000));
    setTotalFocusedTime(0);
    setOpenEndSessionEarlyModal(false);
    cancelNotification(NOTIFICATION_ID.FOCUS);
  };

  const addTimeToFocus = useCallback((additionalTime) => {
    const additionalMs = additionalTime.getTime();
    setTotalFocusedTime((prev) => Math.max(0, prev + additionalMs));

    setFocusFinishTime((prevFinishTime) => {
      // When extending from congrats (timer already completed), start the new duration from now
      const now = Date.now();
      const baseTime = prevFinishTime.getTime() < now ? now : prevFinishTime.getTime();
      const newFocusFinishTime = new Date(baseTime + additionalMs);
      const newFocusTime = new Date(newFocusFinishTime.getTime() - Date.now());

      setFocusTime(newFocusTime);

      // Update redux
      dispatch(setFocusModeFinishTime(newFocusFinishTime.toISOString()));

      // Update focus duration for native module blocking
      dispatch(setFocusDuration({ hours: newFocusTime.getUTCHours(), minutes: newFocusTime.getUTCMinutes() }));

      const defaultFocusModeId = getDefaultFocusMode();
      if (defaultFocusModeId) {
        // Update backend: focus session scheduled finish time
        dispatch(updateFocusModeScheduledFinish(defaultFocusModeId, newFocusFinishTime.toISOString()));
      }

      return newFocusFinishTime;
    });
  }, []);

  const reduceTimeFromFocus = useCallback((reductionTime) => {
    const reductionMs = reductionTime.getTime();

    setFocusFinishTime((prevFinishTime) => {
      // Calculate the new finish time after reduction
      const newFocusFinishTime = new Date(prevFinishTime.getTime() - reductionMs);

      // Ensure we don't reduce below 1 minute
      const minFinishTime = new Date(Date.now() + 60 * 1000); // 1 minute from now
      const finalFocusFinishTime = newFocusFinishTime > minFinishTime ? newFocusFinishTime : minFinishTime;

      const actualReduction = prevFinishTime.getTime() - finalFocusFinishTime.getTime();
      setTotalFocusedTime((prev) => Math.max(0, prev - actualReduction));

      // Calculate the new focus time
      const newFocusTime = new Date(finalFocusFinishTime.getTime() - Date.now());

      setFocusTime(newFocusTime);

      // Update redux
      dispatch(setFocusModeFinishTime(finalFocusFinishTime.toISOString()));

      // Update focus duration for native module blocking
      dispatch(setFocusDuration({ hours: newFocusTime.getUTCHours(), minutes: newFocusTime.getUTCMinutes() }));

      const defaultFocusModeId = getDefaultFocusMode();
      if (defaultFocusModeId) {
        // Update backend: focus session scheduled finish time
        dispatch(updateFocusModeScheduledFinish(defaultFocusModeId, finalFocusFinishTime.toISOString()));
      }

      return finalFocusFinishTime;
    });
  }, []);

  // Reschedule notification when finishTime changes
  useEffect(() => {
    if (focusFinishTime.getTime() - Date.now() > 0) {
      cancelNotification(NOTIFICATION_ID.FOCUS)
        .then(() => {
          createTriggerNotification({
            id: NOTIFICATION_ID.FOCUS,
            timestamp: focusFinishTime.getTime(),
            title: `${congratsMessage}`,
            body: `${t("focusMode.focusDoneDescription")} ${timeString}`,
          });
        })
        .catch((err) => {
          addErrorLog("Error in cancelNotification", err);
        });
    }
  }, [focusFinishTime]);

  const renderFocusing = useCallback(
    () => (
      <Focusing
        key={focusFinishTime.getTime()}
        {...{
          timeString,
          focusFinishTime,
          onFocusDone,
          addTimeToFocus,
          reduceTimeFromFocus,
          focusNotes,
          setFocusModeNotes,
          congratsMessage,
          isSuperStrict,
          setIsSuperStrict,
        }}
      />
    ),
    [
      addTimeToFocus,
      reduceTimeFromFocus,
      congratsMessage,
      focusFinishTime,
      focusNotes,
      isSuperStrict,
      onFocusDone,
      timeString,
    ],
  );

  const renderStartFocusing = useCallback(
    () => (
      <StartFocusing
        {...{
          setFocusTime,
          focusNotes,
          setFocusModeNotes,
          isSuperStrict,
          setIsSuperStrict,
        }}
      />
    ),
    [focusNotes, isSuperStrict, setIsSuperStrict],
  );

  const renderFinishFocusing = useCallback(
    () => (
      <FinishFocusing
        {...{
          focusNotes,
          timeString: getTotalFocusedTimeString(), // Use the function instead of memoized value
          achievedInput,
          setAchievedInput,
          distractionInput,
          setDistractionInput,
        }}
      />
    ),
    [focusNotes, getTotalFocusedTimeString, achievedInput, setAchievedInput, distractionInput, setDistractionInput],
  );

  const renderContent = useCallback(() => {
    switch (focusState) {
      case FocusState.START:
        return renderStartFocusing();

      case FocusState.FOCUSING:
      case FocusState.CONGRATS:
        return renderFocusing();

      case FocusState.FINISH_FOCUSING:
        return renderFinishFocusing();
    }
  }, [focusState, renderFocusing, renderFinishFocusing, renderStartFocusing]);

  const timeString = useMemo(() => {
    const hours = focusTime.getUTCHours();
    let minutes = focusTime.getUTCMinutes();
    const seconds = focusTime.getUTCSeconds();

    // Round up by a minute
    if (seconds >= 30 || (!hours && !minutes)) {
      minutes += 1;
    }

    return formatDuration(hours, minutes);
  }, [focusTime]);

  const focusButtonTitle = useMemo(() => {
    switch (focusState) {
      case FocusState.START:
        return t("focusMode.startFocusing");

      case FocusState.FOCUSING:
        return isSuperStrict ? t("focusMode.superStrictMode") : t("focusMode.endSession");

      case FocusState.CONGRATS:
        return t("common.continue");

      case FocusState.FINISH_FOCUSING:
        return t("focusMode.completeFocus");
    }
  }, [focusState, isSuperStrict, t]);

  const isFocusButtonDisabled = useMemo(() => {
    return (isSuperStrictMode && isFocusing) || focusTime.getTime() <= 0;
  }, [isSuperStrictMode, isFocusing, focusTime]);

  const shouldBlockWarningBeShown = shouldShowWarningForBlockedApps || !allBlockingPermissionsGranted;

  const onFocusButtonPressed = () => {
    switch (focusState) {
      case FocusState.START:
        if (shouldBlockWarningBeShown) {
          setIsBlockingWarningVisible(true);
          return;
        }
        return onStartFocus();

      case FocusState.FOCUSING:
        return onButtonEndSessionEarlyPressed();

      case FocusState.CONGRATS:
        return setFocusState(FocusState.FINISH_FOCUSING);

      case FocusState.FINISH_FOCUSING:
        setTotalFocusedTime(0);
        return setFocusState(FocusState.START);
    }
  };

  const onWarningPressed = () => {
    if (!allBlockingPermissionsGranted) {
      navigation.navigate(NAVIGATION.PermissionsScreen);
    } else {
      navigation.navigate(checkIsAndroid() ? NAVIGATION.AppsBlockList : NAVIGATION.BlockingScheduleList);
    }
  };

  return (
    <View style={styles.flex}>
      {focusState === FocusState.START && !fromInduction && (
        <AppHeader title={t("focusMode.focusTitle")} hideBackButton />
      )}
      {focusState === FocusState.START && fromInduction && <AppHeader title={t("simpleHome.focusScreenTitle")} />}

      {renderContent()}

      <SafeAreaView
        edges={fromInduction ? ["bottom"] : []}
        style={[styles.focusButtonContainer, { borderColor: colors.separator, backgroundColor: colors.card }]}
      >
        {focusState === FocusState.CONGRATS ? (
          <>
            <Button
              testID="test:id/extend-focus-button"
              title={t("focusMode.extendFocus")}
              onPress={() => setIsExtendModalVisible(true)}
              style={styles.focusButton}
              titleNumberOfLines={2}
            />
            <Button
              primary
              testID="test:id/start-focusing"
              title={focusButtonTitle}
              onPress={onFocusButtonPressed}
              style={styles.focusButton}
              titleNumberOfLines={2}
            />
          </>
        ) : (
          <Button
            primary={!isFocusing}
            testID="test:id/start-focusing"
            title={focusButtonTitle}
            disabled={isFocusButtonDisabled}
            onPress={onFocusButtonPressed}
            titleNumberOfLines={2}
            style={styles.focusButton}
          />
        )}
      </SafeAreaView>

      <ModifyFocusSessionModal
        isVisible={isExtendModalVisible}
        onCancel={() => setIsExtendModalVisible(false)}
        onConfirm={(additionalTime) => {
          addTimeToFocus(additionalTime);
          setIsExtendModalVisible(false);
          setFocusState(FocusState.FOCUSING);
        }}
        mode="extend"
      />

      <ExitFocusingModal
        isVisible={openEndSessionEarlyModal}
        onCancel={() => setOpenEndSessionEarlyModal(false)}
        onConfirm={() => onEndFocusEarly()}
      />
      <ConfirmationModal
        isVisible={isBlockingWarningVisible}
        title={t("focusMode.distractionBlockingNotActiveTitle")}
        text={t("focusMode.distractionBlockingNotActiveText")}
        cancelTitle={t("focusMode.continueWithoutBlocking")}
        confirmTitle={t("focusMode.fixBlocking")}
        onCancel={() => {
          setIsBlockingWarningVisible(false);
          onStartFocus();
        }}
        onConfirm={() => {
          setIsBlockingWarningVisible(false);
          onWarningPressed();
        }}
      />
    </View>
  );
});
