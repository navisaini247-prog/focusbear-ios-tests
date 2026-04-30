import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { onboardingMicroBreakFlagSelector, onboardingStartFocusSessionFlagSelector } from "@/selectors/GlobalSelectors";
import { useHomeContext } from "../../Home/context";
import { useTranslation } from "react-i18next";
import { BodySmallText } from "@/components";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { NAVIGATION } from "@/constants";
import { TouchableOpacity } from "react-native";

export const OnboardingProgressBar = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const {
    isOverlayPermissionGranted,
    isUsagePermissionGranted,
    isScreenTimePermissionGranted,
    isPushNotificationPermissionGranted,
  } = useHomeContext();

  const onboardingFocusSessionFlag = useSelector(onboardingStartFocusSessionFlagSelector);
  const onboardingMicroBreakFlag = useSelector(onboardingMicroBreakFlagSelector);

  const { progress, nextStep, isCompleted } = useMemo(() => {
    if (checkIsAndroid()) {
      const totalSteps = 5; // 3 permissions + 2 onboarding flags
      const steps = [
        { completed: isUsagePermissionGranted, text: t("onboarding.nextStep.usagePermission") },
        { completed: isPushNotificationPermissionGranted, text: t("pushNotiPermission.title") },
        { completed: isOverlayPermissionGranted, text: t("onboarding.nextStep.overlayPermission") },
        { completed: onboardingFocusSessionFlag, text: t("onboarding.nextStep.focusSession") },
        { completed: onboardingMicroBreakFlag, text: t("onboarding.nextStep.microBreak") },
      ];

      const completedSteps = steps.filter((step) => step.completed).length;
      const nextStep = steps.find((step) => !step.completed)?.text || t("onboarding.nextStep.allDone");

      return {
        progress: (completedSteps / totalSteps) * 100,
        nextStep,
        isCompleted: completedSteps === totalSteps,
      };
    } else {
      const totalSteps = 4; // 2 permission + 2 onboarding flags
      const steps = [
        { completed: isPushNotificationPermissionGranted, text: t("pushNotiPermission.title") },
        { completed: isScreenTimePermissionGranted, text: t("onboarding.nextStep.screenTimePermission") },
        { completed: onboardingFocusSessionFlag, text: t("onboarding.nextStep.focusSession") },
        { completed: onboardingMicroBreakFlag, text: t("onboarding.nextStep.microBreak") },
      ];

      const completedSteps = steps.filter((step) => step.completed).length;
      const nextStep = steps.find((step) => !step.completed)?.text || t("onboarding.nextStep.allDone");

      return {
        progress: (completedSteps / totalSteps) * 100,
        nextStep,
        isCompleted: completedSteps === totalSteps,
      };
    }
  }, [
    isUsagePermissionGranted,
    isOverlayPermissionGranted,
    isScreenTimePermissionGranted,
    onboardingFocusSessionFlag,
    isPushNotificationPermissionGranted,
    onboardingMicroBreakFlag,
    t,
  ]);

  const onClickNextStep = () => {
    navigation.navigate(NAVIGATION.SimpleHome);
  };

  if (isCompleted) {
    return null;
  }

  return (
    <TouchableOpacity testID="test:id/onboarding-progress-bar" onPress={onClickNextStep} style={styles.container}>
      <View style={[styles.progressBar, { backgroundColor: colors.separator }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <BodySmallText center color={colors.subText}>
        {t("onboarding.nextStep.upNext", { step: nextStep })}
      </BodySmallText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 32,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});
