import React from "react";
import { View, ScrollView, StyleSheet, GestureResponderEvent } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { ProgressBar } from "./components/ProgressBar";
import { IntroStep } from "./components/IntroStep";
import { ScreenTimePermissionStep } from "./components/ScreenTimePermissionStep";
import { WhatYouNeedStep } from "./components/WhatYouNeedStep";
import { AndroidUsagePermissionStep } from "./components/AndroidUsagePermissionStep";
import { AndroidOverlayIntroStep } from "./components/AndroidOverlayIntroStep";
import { AndroidOverlayPermissionVisualStep } from "./components/AndroidOverlayPermissionVisualStep";
import { AndroidScheduleSetupStep } from "./components/AndroidScheduleSetupStep";
import { ScheduleCreatedStep } from "./components/ScheduleCreatedStep";
import { FinishStep } from "./components/FinishStep";
import COLOR from "@/constants/color";
import { Button, PressableWithFeedback, BodyLargeText } from "@/components";
import { StepKey } from "./blockingPermissionSteps";
import { useBlockingPermissionIntro } from "./hooks/useBlockingPermissionIntro";
import { CongratsMark } from "@/components/CongratsMark";

type Props = {
  onSkip?: (event: GestureResponderEvent) => void;
  onFinish?: (event: GestureResponderEvent) => void;
};

const BlockingPermissionIntro: React.FC<Props> = ({ onSkip, onFinish }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    currentStep,
    showCongrats,
    footerHeight,
    setFooterHeight,
    totalProgressSteps,
    createdSchedule,
    isRequestingScreenTimePermission,
    handlePrimaryPress,
    handleSkipPress,
    handleFinishPress,
  } = useBlockingPermissionIntro({ onSkip, onFinish });

  const renderStepContent = () => {
    switch (currentStep.key) {
      case StepKey.Intro:
        return <IntroStep />;
      case StepKey.ScreenTimePermission:
        return <ScreenTimePermissionStep showCongrats={showCongrats} />;
      case StepKey.WhatYouNeed:
        return <WhatYouNeedStep />;
      case StepKey.UsagePermission:
        return <AndroidUsagePermissionStep />;
      case StepKey.OverlayIntro:
        return <AndroidOverlayIntroStep />;
      case StepKey.OverlayPermissionVisual:
        return <AndroidOverlayPermissionVisualStep />;
      case StepKey.ScheduleSetup:
        return <AndroidScheduleSetupStep />;
      case StepKey.ScheduleCreated:
        return <ScheduleCreatedStep createdSchedule={createdSchedule} />;
      case StepKey.Finish:
        return <FinishStep onPrimaryPress={handleFinishPress} />;
      default:
        return null;
    }
  };

  const showFooter = currentStep.key !== StepKey.Finish;
  const primaryLabel = showCongrats ? t("common.continue") : currentStep.primaryLabel;
  const showCongratsMark =
    (currentStep.key === StepKey.ScreenTimePermission ||
      currentStep.key === StepKey.UsagePermission ||
      currentStep.key === StepKey.OverlayPermissionVisual) &&
    showCongrats;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {currentStep.progressStep > 0 && (
          <ProgressBar currentStep={currentStep.progressStep} totalSteps={totalProgressSteps} />
        )}

        <ScrollView
          key={currentStep.key}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {showFooter && (
          <View
            style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}
            onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
          >
            {currentStep.showSkip && !showCongrats && (
              <PressableWithFeedback
                testID="test:id/blocking-permission-intro-skip"
                onPress={handleSkipPress}
                style={styles.skipButton}
                hitSlop={12}
              >
                <BodyLargeText center underline style={styles.skipText}>
                  {t("common.skip")}
                </BodyLargeText>
              </PressableWithFeedback>
            )}

            <Button
              testID="test:id/blocking-permission-intro-primary"
              title={primaryLabel}
              onPress={handlePrimaryPress}
              disabled={isRequestingScreenTimePermission}
              primary
              style={styles.primaryButton}
            />
          </View>
        )}
      </View>

      {showCongratsMark && (
        <View pointerEvents="none" style={[styles.congratsMarkContainer, { bottom: footerHeight }]}>
          <CongratsMark size={300} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLOR.GRAY[950],
    position: "relative",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 8,
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderTopWidth: 2,
    borderTopColor: COLOR.GRAY[800],
    backgroundColor: COLOR.GRAY[900],
  },
  skipButton: {
    alignSelf: "center",
    marginBottom: 16,
  },
  skipText: {
    color: COLOR.GRAY[400],
  },
  primaryButton: {
    marginTop: 8,
  },
  congratsMarkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});

export { BlockingPermissionIntro };
