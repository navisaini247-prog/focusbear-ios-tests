import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, ScrollView, View, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { NAVIGATION } from "@/constants";
import COLOR from "@/constants/color";
import { BodyLargeText, Button } from "@/components";
import { ProgressBar } from "@/screens/BlockingPermissionIntro/components/ProgressBar";
import { CaptainIntroStep } from "@/screens/OnBoarding/components/CaptainIntroStep";
import { CaptainHabitsStep } from "@/screens/OnBoarding/components/CaptainHabitsStep";
import { CaptainHabitListStep } from "@/screens/OnBoarding/components/CaptainHabitListStep";
import { CaptainImportHabitStep } from "@/screens/OnBoarding/components/CaptainImportHabitStep";
import { styles } from "./CaptainBearIntro.styles";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
export const CaptainBearIntro: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = stepIndex + 1;

  useEffect(() => {
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_CAPTAIN_BEAR_INTRO_SCREEN_OPENED);
  }, []);

  const handleBackPress = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((prev) => Math.max(0, prev - 1));
      return true;
    }
    return false;
  }, [stepIndex]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      const handled = handleBackPress();
      if (handled) {
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [handleBackPress]);

  const renderStepContent = () => {
    switch (stepIndex) {
      case 0:
        return <CaptainIntroStep />;
      case 1:
        return <CaptainHabitsStep />;
      case 2:
        return <CaptainHabitListStep />;
      case 3:
      default:
        return <CaptainImportHabitStep />;
    }
  };

  const { bottom } = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ProgressBar currentStep={currentStep} totalSteps={5} />

        <ScrollView
          key={stepIndex}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {stepIndex === 0 && (
          <View style={[styles.footer, { paddingBottom: bottom + 12 }]}>
            <Button
              primary
              title={t("common.ok_ellipsis")}
              onPress={() => setStepIndex(1)}
              testID="test:id/captain-bear-intro-okay"
            />
          </View>
        )}
        {stepIndex === 1 && (
          <View style={[styles.footer, { paddingBottom: bottom + 12 }]}>
            <TouchableOpacity
              onPress={() => {
                postHogCapture(POSTHOG_EVENT_NAMES.HABIT_GENERATE_SKIP);
                navigation.replace(NAVIGATION.BlockingPermissionIntro as never);
              }}
              testID="test:id/captain-bear-intro-skip"
              style={styles.textSkip}
            >
              <BodyLargeText center underline style={styles.textSkipLabel} color={colors.subText}>
                {t("common.skip")}
              </BodyLargeText>
            </TouchableOpacity>
            <Button
              primary
              title={t("onboarding.setupHabitsCta")}
              onPress={() => setStepIndex(2)}
              testID="test:id/captain-bear-intro-setup-habits"
            />
          </View>
        )}
        {stepIndex === 2 && (
          <View style={[styles.secondaryFooter, { paddingBottom: bottom + 12 }]}>
            <Button
              title={t("onboarding.habitList.ayeLabel")}
              onPress={() => {
                postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_LIST_IMPORT_CONFIRMED);
                setStepIndex(3);
              }}
              style={styles.footerButton}
              testID="test:id/captain-bear-intro-habit-list-import"
              textColor={COLOR.WHITE}
            />
            <Button
              title={t("onboarding.habitList.nayLabel")}
              onPress={() => {
                postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_LIST_IMPORT_DECLINED);
                navigation.navigate(NAVIGATION.UserAchievement as never);
              }}
              primary
              style={styles.footerButton}
              testID="test:id/captain-bear-intro-habit-list-no"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
