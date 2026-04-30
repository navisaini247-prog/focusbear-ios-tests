import { useEffect, useMemo, useState } from "react";
import { DeviceEventEmitter, GestureResponderEvent } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import { NAVIGATION } from "@/constants";
import type { ScreenNavigationProp } from "@/navigation/AppNavigator";
import { setHasGoneThroughIntroduction, setIsOnboardingStatus } from "@/actions/GlobalActions";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import {
  StepKey,
  StepConfig,
  createStepsIOS,
  createStepsAndroid,
  getTotalProgressSteps,
} from "../blockingPermissionSteps";
import { useHomeContext } from "@/screens/Home/context";

type OnSkipHandler = (event: GestureResponderEvent) => void;
type OnFinishHandler = (event: GestureResponderEvent) => void;

type UseBlockingPermissionIntroOptions = {
  onSkip?: OnSkipHandler;
  onFinish?: OnFinishHandler;
};

export const useBlockingPermissionIntro = ({ onSkip, onFinish }: UseBlockingPermissionIntroOptions) => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  const {
    requestScreenTimePermission,
    requestUsagePermission,
    requestOverlayPermission,
    isRequestingScreenTimePermission,
    isScreenTimePermissionGranted,
    isUsagePermissionGranted,
    isOverlayPermissionGranted,
    allSchedules,
    syncSchedules,
  } = useHomeContext() as any;

  const steps = useMemo(
    () =>
      checkIsAndroid()
        ? createStepsAndroid(t, !!isUsagePermissionGranted, !!isOverlayPermissionGranted)
        : createStepsIOS(t),
    [t, isUsagePermissionGranted, isOverlayPermissionGranted],
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("onBlockingScheduleCreated", () => {
      syncSchedules();
      const scheduleStepIndex = steps.findIndex((step) => step.key === StepKey.ScheduleCreated);
      if (scheduleStepIndex !== -1) {
        setStepIndex(scheduleStepIndex);
      }
    });
    return () => subscription.remove();
  }, [syncSchedules, steps]);

  useEffect(() => {
    postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_PERMISSION_INTRO_STARTED);
  }, []);

  const currentStep: StepConfig = useMemo(
    () => steps[Math.min(Math.max(stepIndex, 0), steps.length - 1)],
    [stepIndex, steps],
  );

  useEffect(() => {
    postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_PERMISSION_INTRO_STEP_VIEWED, {
      stepKey: currentStep.key,
      stepIndex,
    });
  }, [stepIndex, currentStep.key]);

  useEffect(() => {
    if (showCongrats) {
      return;
    }

    // Skip permission steps that are already granted when user returns from settings.
    if (!checkIsAndroid() && currentStep.key === StepKey.ScreenTimePermission && isScreenTimePermissionGranted) {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }

    if (checkIsAndroid() && currentStep.key === StepKey.UsagePermission && isUsagePermissionGranted) {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }

    if (checkIsAndroid() && currentStep.key === StepKey.OverlayIntro && isOverlayPermissionGranted) {
      setStepIndex((prev) => Math.min(prev + 2, steps.length - 1));
      return;
    }

    if (checkIsAndroid() && currentStep.key === StepKey.OverlayPermissionVisual && isOverlayPermissionGranted) {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }, [
    currentStep.key,
    isOverlayPermissionGranted,
    isScreenTimePermissionGranted,
    isUsagePermissionGranted,
    showCongrats,
    steps.length,
  ]);

  const createdSchedule = useMemo(() => allSchedules[0], [allSchedules]);

  const totalProgressSteps = getTotalProgressSteps();

  const goToNextStep = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_PERMISSION_INTRO_STEP_COMPLETED, {
      stepKey: currentStep.key,
      stepIndex,
    });
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrimaryPress = async (_event: GestureResponderEvent) => {
    if (showCongrats) {
      setShowCongrats(false);
      goToNextStep();
      return;
    }

    switch (currentStep.key) {
      case StepKey.Intro:
        goToNextStep();
        break;

      case StepKey.ScreenTimePermission:
        await requestScreenTimePermission();
        setShowCongrats(true);
        break;

      case StepKey.WhatYouNeed:
        postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_PERMISSION_INTRO_STEP_COMPLETED, {
          stepKey: currentStep.key,
          stepIndex,
        });
        navigation.navigate(NAVIGATION.BlockingSchedule);
        break;

      case StepKey.UsagePermission:
        if (isUsagePermissionGranted) {
          goToNextStep();
        } else {
          await requestUsagePermission();
        }
        break;

      case StepKey.OverlayIntro:
        goToNextStep();
        break;

      case StepKey.OverlayPermissionVisual:
        if (isOverlayPermissionGranted) {
          goToNextStep();
        } else {
          await requestOverlayPermission();
          goToNextStep();
        }
        break;

      case StepKey.ScheduleSetup:
        postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_PERMISSION_INTRO_STEP_COMPLETED, {
          stepKey: currentStep.key,
          stepIndex,
        });
        navigation.navigate(NAVIGATION.BlockingSchedule);
        break;

      case StepKey.ScheduleCreated:
        goToNextStep();
        break;

      default:
        goToNextStep();
    }
  };

  const handleSkipPress = (event: GestureResponderEvent) => {
    postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_PERMISSION_INTRO_SKIPPED, {
      stepKey: currentStep.key,
      stepIndex,
    });
    dispatch(setHasGoneThroughIntroduction(true));
    if (onSkip) {
      onSkip(event);
      return;
    }
    dispatch(setIsOnboardingStatus(true));
  };

  const handleFinishPress = (event: GestureResponderEvent) => {
    postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_PERMISSION_INTRO_FINISHED);
    dispatch(setHasGoneThroughIntroduction(true));
    if (onFinish) {
      onFinish(event);
      return;
    }
    dispatch(setIsOnboardingStatus(true));
  };

  return {
    currentStep,
    steps,
    stepIndex,
    showCongrats,
    footerHeight,
    setFooterHeight,
    totalProgressSteps,
    createdSchedule,
    isRequestingScreenTimePermission,
    handlePrimaryPress,
    handleSkipPress,
    handleFinishPress,
  };
};
