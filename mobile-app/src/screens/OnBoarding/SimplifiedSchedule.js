import React, { useEffect, useMemo, useState } from "react";
import { View, Image, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useTheme, useNavigation } from "@react-navigation/native";
import DatePicker from "react-native-date-picker";
import { useTranslation } from "react-i18next";
import LottieView from "lottie-react-native";
import { styles as customStyles } from "./TimeSetup.styles";
import { NAVIGATION } from "@/constants";
import { HeadingXLargeText, ConfirmationButton, Button, HeadingWithInfo } from "@/components";
import { BodyLargeText } from "@/components/Text";
import { useDispatch, useSelector } from "react-redux";
import { putUserSettings, storeHabitPack } from "@/actions/UserActions";
import { HabitPackKeys } from "@/types/HabitPacks";
import { useUpdateOnboardingProcess } from "@/hooks/use-update-onboarding-process";
import { userRoutineDataAction } from "@/actions/RoutineActions";
import { addErrorLog } from "@/utils/FileLogger";
import { BLANK_HABITS_FOR_FOCUS_ONLY } from "@/constants/activity";
import OnboardingProgress from "./OnboardingProgress";
import { ONBOARDING_STEPS, getOnboardingIndex, useOnboardingStepLabels } from "./onboardingSteps";
import { setIsOnboardingStatus } from "@/actions/GlobalActions";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import {
  DEFAULT_STARTUP_TIME,
  DEFAULT_SHUTDOWN_TIME,
  DEFAULT_CUTOFF_TIME,
  DEFAULT_BREAK_AFTER_MINUTES,
} from "@/constants/routines";

const BearTechCurfewLottie = require("@/assets/bears/bear-techcurfew.json");
import WelcomeBear8 from "@/assets/bears/welcome-bear-8.png";
import PirateCurfew from "@/assets/bears/pirate-curfew.png";
import BigWave from "@/assets/bears/big-wave.svg";
import WaveLightTheme from "@/assets/bears/wave-light-theme.svg";

export const SimplifiedSchedule = () => {
  const { height: screenHeight } = useWindowDimensions();
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const fullRoutineData = useSelector((state) => state.routine.fullRoutineData);
  const juniorBearMode = useSelector((state) => state.global.juniorBearMode) || "normal";
  const isPirate = juniorBearMode === "pirate";
  const { colors, dark } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => customStyles(colors), [colors]);
  const params = route?.params;
  const settings = params?.settings;
  const isFocusHabitOnly = !!params?.isFocusHabitOnly;
  const isFromAppNavigator = !!params?.isFromAppNavigator;
  const [isLoading, setIsLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [curfewTime, setCurfewTime] = useState(new Date());
  const onboardingLabels = useOnboardingStepLabels();

  useUpdateOnboardingProcess(NAVIGATION.TimeSetup);

  useEffect(() => {
    dispatch(userRoutineDataAction());
  }, [dispatch]);

  useEffect(() => {
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_SIMPLIFIED_SCHEDULE_SCREEN_OPENED, {
      isFocusHabitOnly,
      isFromAppNavigator,
    });
  }, []);

  // Set default curfew time to 10 PM
  useEffect(() => {
    const defaultTime = new Date();
    defaultTime.setHours(22, 0, 0, 0);
    setCurfewTime(defaultTime);
  }, []);

  const totalEveningRoutineDurationInSec = useMemo(() => {
    if (!fullRoutineData?.evening_activities) {
      return 0;
    }
    return fullRoutineData.evening_activities.reduce((total, activity) => total + (activity.duration_seconds || 0), 0);
  }, [fullRoutineData?.evening_activities]);

  const calculateTimes = (curfewTimeValue) => {
    const curfewHours = curfewTimeValue.getHours();
    const curfewMinutes = curfewTimeValue.getMinutes();

    // Format curfew time
    const cutoffTime = `${curfewHours.toString().padStart(2, "0")}:${curfewMinutes.toString().padStart(2, "0")}`;

    // Calculate startup time (curfew + 8 hours)
    let startupHours = curfewHours + 8;
    if (startupHours >= 24) {
      startupHours -= 24;
    }
    const startupTime = `${startupHours.toString().padStart(2, "0")}:${curfewMinutes.toString().padStart(2, "0")}`;

    // Calculate shutdown time (curfew - evening routine duration)
    const eveningRoutineMinutes = Math.floor(totalEveningRoutineDurationInSec / 60);
    let shutdownHours = curfewHours;
    let shutdownMinutes = curfewMinutes - eveningRoutineMinutes;

    // Handle minute underflow
    while (shutdownMinutes < 0) {
      shutdownMinutes += 60;
      shutdownHours -= 1;
    }

    // Handle hour underflow (crossing midnight)
    if (shutdownHours < 0) {
      shutdownHours += 24;
    }

    const shutdownTime = `${shutdownHours.toString().padStart(2, "0")}:${shutdownMinutes.toString().padStart(2, "0")}`;

    return { cutoffTime, startupTime, shutdownTime };
  };

  const handleNoThanks = async () => {
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_SIMPLIFIED_SCHEDULE_NO_THANKS_CLICKED, {
      isFocusHabitOnly,
      isFromAppNavigator,
    });
    const routineData = isFocusHabitOnly ? BLANK_HABITS_FOR_FOCUS_ONLY : fullRoutineData;

    setIsLoading(true);
    const _settings = {
      ...settings,
      [HabitPackKeys.STARTUP_TIME]: DEFAULT_STARTUP_TIME,
      [HabitPackKeys.SHUTDOWN_TIME]: DEFAULT_SHUTDOWN_TIME,
      [HabitPackKeys.SLEEP_TIME]: DEFAULT_CUTOFF_TIME,
      break_after_minutes: DEFAULT_BREAK_AFTER_MINUTES,
    };

    delete _settings.minHours;
    delete _settings.minMinutes;

    try {
      await dispatch(putUserSettings({ ...routineData, ..._settings }, true));
      dispatch(storeHabitPack({ ...routineData, ..._settings }));
      dispatch(setIsOnboardingStatus(true));
    } catch (error) {
      addErrorLog("Error saving simplified schedule - no thanks");
    } finally {
      setIsLoading(false);
      if (isFromAppNavigator) {
        addErrorLog("SimplifiedSchedule: Navigating from AppNavigator context");
        navigation.navigate(NAVIGATION.TabNavigator);
      }
    }
  };

  const handleTimeConfirm = async () => {
    const { cutoffTime, startupTime, shutdownTime } = calculateTimes(curfewTime);
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_SIMPLIFIED_SCHEDULE_CONFIRM_TIME_CLICKED, {
      cutoffTime,
      startupTime,
      shutdownTime,
      isFocusHabitOnly,
      isFromAppNavigator,
    });
    const routineData = isFocusHabitOnly ? BLANK_HABITS_FOR_FOCUS_ONLY : fullRoutineData;

    setIsLoading(true);
    const _settings = {
      ...settings,
      [HabitPackKeys.STARTUP_TIME]: startupTime,
      [HabitPackKeys.SHUTDOWN_TIME]: shutdownTime,
      [HabitPackKeys.SLEEP_TIME]: cutoffTime,
      break_after_minutes: 60,
    };

    delete _settings.minHours;
    delete _settings.minMinutes;

    try {
      await dispatch(putUserSettings({ ...routineData, ..._settings }, true));
      dispatch(storeHabitPack({ ...routineData, ..._settings }));
      dispatch(setIsOnboardingStatus(true));
    } catch (error) {
      addErrorLog("Error saving simplified schedule - with curfew");
    } finally {
      setIsLoading(false);
      if (isFromAppNavigator) {
        addErrorLog("SimplifiedSchedule: Navigating from AppNavigator context");
        navigation.navigate(NAVIGATION.TabNavigator);
      }
    }
  };

  const closeTime = (selectedValue) => {
    setCurfewTime(selectedValue);
  };

  if (showTimePicker) {
    return (
      <SafeAreaView edges={["top"]} style={styles.flex}>
        {getOnboardingIndex(route.name) >= 0 && (
          <OnboardingProgress
            totalSteps={ONBOARDING_STEPS.length}
            activeIndex={getOnboardingIndex(route.name)}
            activeColor={colors.primary}
            inactiveColor={colors.border}
            labels={onboardingLabels}
            labelColor={colors.subText}
            dotSize={20}
          />
        )}
        <View style={[styles.container, styles.flex]}>
          <View style={styles.flex}>
            <HeadingWithInfo infoText={t("setupTime.techCurfewTooltip")}>
              <HeadingXLargeText center style={styles.headingText}>
                {t("setupTime.whatTimeGetOffTech")}
              </HeadingXLargeText>
            </HeadingWithInfo>
          </View>

          <View style={styles.timeContainerWrapper}>
            {!isPirate && <Image source={WelcomeBear8} style={styles.bearOverlay} resizeMode="contain" />}
            <View style={styles.timeContainer}>
              <DatePicker
                mode="time"
                date={curfewTime}
                onDateChange={(selectedTime) => closeTime(selectedTime)}
                is24hour
                androidVariant="iosClone"
                fadeToColor={colors.background}
              />
            </View>
          </View>
        </View>
        {isPirate && (
          <View style={styles.waveContainer}>
            {dark ? (
              <BigWave width="100%" height={screenHeight * 0.25} />
            ) : (
              <WaveLightTheme width="100%" height={screenHeight * 0.25} />
            )}
          </View>
        )}
        <ConfirmationButton
          isLoading={isLoading}
          confirmTestID="test:id/confirm-curfew-time"
          onConfirm={handleTimeConfirm}
          confirmTitle={t("common.next")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      {getOnboardingIndex(route.name) >= 0 && (
        <OnboardingProgress
          totalSteps={ONBOARDING_STEPS.length}
          activeIndex={getOnboardingIndex(route.name)}
          activeColor={colors.primary}
          inactiveColor={colors.border}
          labels={onboardingLabels}
          labelColor={colors.subText}
          dotSize={20}
        />
      )}
      <View style={[styles.container, styles.flex]}>
        <View style={styles.flex}>
          <HeadingXLargeText center style={styles.headingText}>
            {t("setupTime.bedtimeForScreens")}
          </HeadingXLargeText>
          <BodyLargeText center style={styles.subtitleText} color={colors.subText}>
            {t("setupTime.bedtimeForScreensSubtitle")}
          </BodyLargeText>
          <View style={styles.lottieContainer}>
            {isPirate ? (
              <Image source={PirateCurfew} style={styles.lottieAnimation} resizeMode="contain" />
            ) : (
              <LottieView
                source={BearTechCurfewLottie}
                autoPlay
                loop
                style={styles.lottieAnimation}
                resizeMode="contain"
              />
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={handleNoThanks}
            title={t("setupTime.noThanks")}
            isLoading={isLoading}
            testID="test:id/no-thanks-simplified-schedule"
          />

          <Button
            onPress={() => {
              postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_SIMPLIFIED_SCHEDULE_YES_CLICKED, {
                isFocusHabitOnly,
                isFromAppNavigator,
              });
              setShowTimePicker(true);
            }}
            title={t("setupTime.yesPhoneWrecksSleep")}
            primary
            testID="test:id/yes-simplified-schedule"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};
