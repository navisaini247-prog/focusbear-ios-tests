import React, { useEffect, useMemo, useRef, useState } from "react";
import { TouchableOpacity, AppState, StyleSheet } from "react-native";
import { Card, HeadingXLargeText, BodyMediumText, ScalableIcon } from "@/components";
import { convertSecToMins } from "@/utils/TimeMethods";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useTheme } from "@react-navigation/native";
import { APP_STATE_STATUS } from "@/constants/appStateStatus";
import { useSelector } from "react-redux";
import { now } from "lodash";
import BackgroundTimer from "react-native-background-timer";
import { addInfoLog } from "@/utils/FileLogger";
import { hideFloatingView, showFloatingView } from "@/utils/NativeModuleMethods";
import { routineProcessSelector } from "@/selectors/RoutineSelectors";
import { useUpdateActivityCompletionProgress } from "../hooks/use-update-activity-completing-progress";
import { useRoutineDetailContext } from "../context/context";
import SkippedModal from "@/screens/Complete/SkippedScreen";
import { FocusMusicButton } from "@/screens/FocusMode/FocusMusicButton";
import { AllowedAppsButton } from "./AllowedAppsButton";
import { playTimerCompletionSound } from "@/utils/SoundPlayer";
import { useFontScale } from "@/hooks/use-font-scale";
import { vibrateFocusTimerCompletion } from "@/utils/Vibration";
import { useKeepAwake } from "@sayem314/react-native-keep-awake";

const TimerComponent = () => {
  const {
    isPlaying,
    noteText,
    activityInfo: { completionRequirements, activityName },
    finishActivity,
    isQuickBreak,
    togglePlaying,
  } = useRoutineDetailContext();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isPostPoneFlowFromDistractionAlert = useSelector((state) => state.activity.isPostPoneFlowFromDistractionAlert);
  const route = useRoute();
  const routineProcess = useSelector(routineProcessSelector);
  const floatingViewClosedOnButtonPress = useSelector((state) => state.global.floatingViewClosedOnButtonPress);

  const [showSkipModal, setShowSkipModal] = useState(false);

  const { item } = route?.params || {};

  const interval = useRef(null);
  const appState = useRef(AppState.currentState);
  const hasCompletedRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(routineProcess?.[item.id]?.duration || item?.duration_seconds);
  const timeLeftRef = useRef(timeLeft);
  useUpdateActivityCompletionProgress(item.id, timeLeft, noteText);

  const { isLargeFontScale } = useFontScale();

  const finishTime = useMemo(() => {
    return Math.floor(now() / 1000 + timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        addInfoLog("App has come to the foreground!");
        hideFloatingView();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (
      (appState.current === APP_STATE_STATUS.INACTIVE ||
        appState.current === APP_STATE_STATUS.BACKGROUND ||
        (isPlaying && !completionRequirements)) &&
      !isPostPoneFlowFromDistractionAlert
    ) {
      // timeLeftRef.current captures the wall-clock finish time at the moment
      // isPlaying/completionRequirements/isPostPoneFlowFromDistractionAlert changes.
      // Using a ref avoids including timeLeft in the dep array, which would reset
      // the interval on every tick.
      const newFinishTime = Math.floor(now() / 1000) + timeLeftRef.current;

      interval.current = BackgroundTimer.setInterval(() => {
        setTimeLeft(Math.max(Math.floor(newFinishTime - now() / 1000), 0));
      }, 1000);
    }
    return () => BackgroundTimer.clearInterval(interval.current);
  }, [isPlaying, isPostPoneFlowFromDistractionAlert, completionRequirements]);

  useEffect(() => {
    const handleFloatingView = () => {
      // If user has closed the floating view via button, don't show it again
      if (floatingViewClosedOnButtonPress) {
        return;
      }

      // Show floating view with current state
      const isPaused = !isPlaying;
      showFloatingView(true, timeLeft, activityName, completionRequirements, isPaused);
    };

    if (timeLeft > 0) {
      handleFloatingView();
    }

    return () => {
      showFloatingView(false);
    };
  }, [timeLeft, isPlaying, completionRequirements, activityName, finishActivity, floatingViewClosedOnButtonPress]);

  useEffect(() => {
    if (timeLeft <= 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      playTimerCompletionSound();
      vibrateFocusTimerCompletion();
      finishActivity();
    }
  }, [timeLeft]);

  useKeepAwake();

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.container, isLargeFontScale && styles.containerWrap]}>
      <Card style={[styles.timerView, isLargeFontScale && styles.timerViewWrap]}>
        {!completionRequirements ? (
          <>
            <HeadingXLargeText>{convertSecToMins(timeLeft)}</HeadingXLargeText>
          </>
        ) : (
          <>
            <BodyMediumText numberOfLines={isLargeFontScale ? 5 : 3}>{completionRequirements}</BodyMediumText>
            <BodyMediumText underline onPress={() => finishActivity()}>
              {t("routineDetail.done")}
            </BodyMediumText>
          </>
        )}
      </Card>
      <TouchableOpacity testID="test:id/pause-play-habit" onPress={togglePlaying} hitSlop={16}>
        <ScalableIcon name={isPlaying ? "pause" : "play"} size={25} color={colors.text} iconType="FontAwesome" />
      </TouchableOpacity>

      {!isQuickBreak && !completionRequirements && (
        <TouchableOpacity
          testID="test:id/skip-habit"
          onPress={() => setShowSkipModal(true)}
          disabled={isPlaying}
          style={isPlaying && styles.hidden}
        >
          <BodyMediumText underline>{t("home.skipHabitDesc")}</BodyMediumText>
        </TouchableOpacity>
      )}
      <FocusMusicButton
        containerStyle={isLargeFontScale ? styles.musicButtonContainerScaled : styles.musicButtonContainer}
      />
      <AllowedAppsButton
        containerStyle={isLargeFontScale ? styles.allowedAppsButtonContainerScaled : styles.allowedAppsButtonContainer}
        allowedApps={item?.allowed_mobile_apps}
      />
      <SkippedModal isVisible={showSkipModal} onClose={() => setShowSkipModal(false)} activity={item} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
  container: {
    gap: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  containerWrap: {
    paddingHorizontal: 16,
  },
  timerView: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timerViewWrap: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  musicButtonContainer: {
    position: "absolute",
    right: 0,
    bottom: "25%",
    zIndex: 10,
  },
  musicButtonContainerScaled: {
    position: "relative",
    alignSelf: "flex-end",
    marginTop: 16,
    zIndex: 10,
  },
  allowedAppsButtonContainer: {
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
  allowedAppsButtonContainerScaled: {
    position: "relative",
    alignSelf: "flex-end",
    marginTop: 8,
    zIndex: 10,
  },
});

export default TimerComponent;
