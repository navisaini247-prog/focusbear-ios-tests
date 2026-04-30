import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useTheme, useNavigation } from "@react-navigation/native";
import DatePicker from "react-native-date-picker";
import { useTranslation } from "react-i18next";
import { styles as customStyles } from "./TimeSetup.styles";
import { NAVIGATION } from "@/constants";
import { BodySmallText, HeadingXLargeText, ConfirmationButton, Space, Button } from "@/components";
import { useDispatch, useSelector } from "react-redux";
import { putUserSettings, storeHabitPack } from "@/actions/UserActions";
import { HabitPackKeys } from "@/types/HabitPacks";
import { useUpdateOnboardingProcess } from "@/hooks/use-update-onboarding-process";
import { BLANK_HABITS_FOR_FOCUS_ONLY } from "@/constants/activity";
import OnboardingProgress from "./OnboardingProgress";
import { ONBOARDING_STEPS, getOnboardingIndex, useOnboardingStepLabels } from "./onboardingSteps";
import EggHatchAnimation from "@/components/EggHatchAnimation";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";
import {
  DEFAULT_STARTUP_TIME,
  DEFAULT_SHUTDOWN_TIME,
  DEFAULT_CUTOFF_TIME,
  DEFAULT_BREAK_AFTER_MINUTES,
} from "@/constants/routines";

export const TimeSetup = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const fullRoutineData = useSelector((state) => state.routine.fullRoutineData);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => customStyles(colors), [colors]);
  const params = route?.params;
  const settings = params?.settings;
  const isFocusHabitOnly = !!params?.isFocusHabitOnly;
  const [isLoading, setIsLoading] = useState(false);
  const onboardingLabels = useOnboardingStepLabels();

  useUpdateOnboardingProcess(NAVIGATION.TimeSetup);

  const [time, setTime] = useState(new Date());
  const [showCurfewPicker, setShowCurfewPicker] = useState(false);

  const pickerFadeToColor = colors.background;

  const closeTime = (selectedValue) => {
    setTime(selectedValue);
  };

  const totalEveningRoutineDurationInSec = useMemo(() => {
    // If there are no evening activities, return 0
    if (!fullRoutineData?.evening_activities) {
      return 0;
    }

    // Calculate the total duration of activities
    const totalDuration = fullRoutineData.evening_activities.reduce(
      (total, activity) => total + (activity.duration_seconds || 0),
      0,
    );

    return totalDuration;
  }, [fullRoutineData?.evening_activities]);

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
          activeEggStage={3}
        />
      )}
      <EggHatchAnimation stage={3} size="small" autoPlay loop={false} />

      <View style={[styles.container, styles.flex]}>
        {!showCurfewPicker && (
          <>
            <HeadingXLargeText center>{t("setupTime.techCurfewQuestion")}</HeadingXLargeText>
            <Space height={8} />
            <BodySmallText center color={colors.subText}>
              {t("setupTime.techCurfewTooltip")}
            </BodySmallText>
            <Space height={24} />
            <Button
              title={t("setupTime.noThanks")}
              onPress={async () => {
                try {
                  postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_TECH_CURFEW_DECLINED);
                  setIsLoading(true);
                  const routineData = isFocusHabitOnly ? BLANK_HABITS_FOR_FOCUS_ONLY : fullRoutineData;
                  const _settings = {
                    ...settings,
                    [HabitPackKeys.STARTUP_TIME]: DEFAULT_STARTUP_TIME,
                    [HabitPackKeys.SHUTDOWN_TIME]: DEFAULT_SHUTDOWN_TIME,
                    [HabitPackKeys.SLEEP_TIME]: DEFAULT_CUTOFF_TIME,
                    break_after_minutes: DEFAULT_BREAK_AFTER_MINUTES,
                  };
                  await dispatch(putUserSettings({ ...routineData, ..._settings }, true));
                  dispatch(storeHabitPack({ ...routineData, ..._settings }));
                  navigation.replace(NAVIGATION.BearsonaOnboardingSettings);
                } finally {
                  setIsLoading(false);
                }
              }}
              testID="test:id/curfew-no"
            />
            <Space height={12} />
            <ConfirmationButton
              confirmTitle={t("setupTime.yesPhoneWrecksSleep")}
              onConfirm={() => {
                postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_TECH_CURFEW_SELECTED);
                setShowCurfewPicker(true);
              }}
              confirmTestID="test:id/curfew-yes"
            />
          </>
        )}
        {showCurfewPicker && (
          <HeadingXLargeText center style={styles.headingText}>
            {t("setupTime.whatTimeGetOffTech")}
          </HeadingXLargeText>
        )}

        {showCurfewPicker && (
          <View style={styles.timeContainer}>
            <DatePicker
              mode="time"
              date={time}
              onDateChange={(selectedTime) => closeTime(selectedTime)}
              is24hour
              androidVariant="iosClone"
              fadeToColor={pickerFadeToColor}
            />
          </View>
        )}
      </View>
      {showCurfewPicker && (
        <ConfirmationButton
          isLoading={isLoading}
          confirmTestID="test:id/submit-time-setup"
          onConfirm={() => {
            // Compute cutoff = time, startup = +8h, shutdown = - evening routine length
            const cutoff = new Date(time);
            const startup = new Date(time);
            startup.setHours(startup.getHours() + 8);
            const shutdown = new Date(time);
            const eveningSeconds = totalEveningRoutineDurationInSec || 30 * 60;
            shutdown.setMinutes(shutdown.getMinutes() - Math.floor(eveningSeconds / 60));

            const toHHMM = (d) =>
              `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

            postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_TECH_CURFEW_TIME_SET, {
              curfew_time: toHHMM(cutoff),
              startup_time: toHHMM(startup),
              shutdown_time: toHHMM(shutdown),
            });

            const routineData = isFocusHabitOnly ? BLANK_HABITS_FOR_FOCUS_ONLY : fullRoutineData;
            const _settings = {
              ...settings,
              [HabitPackKeys.SLEEP_TIME]: toHHMM(cutoff),
              [HabitPackKeys.SHUTDOWN_TIME]: toHHMM(shutdown),
              [HabitPackKeys.STARTUP_TIME]: toHHMM(startup),
              break_after_minutes: 60,
            };

            (async () => {
              try {
                setIsLoading(true);
                await dispatch(putUserSettings({ ...routineData, ..._settings }, true));
                dispatch(storeHabitPack({ ...routineData, ..._settings }));
                navigation.replace(NAVIGATION.BearsonaOnboardingSettings);
              } finally {
                setIsLoading(false);
              }
            })();
          }}
          confirmTitle={t("common.next")}
        />
      )}
    </SafeAreaView>
  );
};
