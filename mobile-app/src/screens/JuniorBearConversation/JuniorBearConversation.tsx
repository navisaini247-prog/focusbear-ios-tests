import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LottieView from "lottie-react-native";
import { useDispatch } from "react-redux";

import { NAVIGATION } from "@/constants";
import WaveBackground from "@/assets/bears/wave-background.png";
import COLOR from "@/constants/color";
import { SpeechBubble } from "./SpeechBubble";
import { ConversationButton, BUTTON_VARIANT } from "./Button";
import { BodyLargeText, FullPageLoading } from "@/components";
import { ProceedButton } from "./ProceedButton";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { signup } from "@/actions/UserActions";
import { GUEST_PASSWORD, createGuestEmail } from "@/hooks/useIsGuestAccount";
import { STEP_CONTENT, JuniorBearStepId, MODE as STEP_MODE } from "./Content";
import { clamp, computeTopHalfHeight, BEAR_HEIGHT, TOP_ROW_HEIGHT } from "./layout";

const MODE = STEP_MODE;

type Mode = typeof MODE.NORMAL;
type StepId = JuniorBearStepId;

interface StepConfig {
  id: StepId;
  message?: string;
  primaryButton?: string | null;
  secondaryButton?: string | null;
  image?: ImageSourcePropType;
  lottieSource?: any;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  options?: Array<{ key: string; label: string; onPress?: () => void }>;
}

type NavigationProp = NativeStackNavigationProp<any>;

export function JuniorBearConversation(): React.JSX.Element {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mode: Mode = MODE.NORMAL;
  const isPirate = false;
  const [currentStepId, setCurrentStepId] = useState<StepId>(JuniorBearStepId.GreetingIntro);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [topRowHeight, setTopRowHeight] = useState(TOP_ROW_HEIGHT);
  const guestEmail = createGuestEmail();

  const getStepConfig = (): StepConfig => {
    const modeSteps = STEP_CONTENT[MODE.NORMAL];
    const baseStep: StepId = (modeSteps[currentStepId] ? currentStepId : JuniorBearStepId.GreetingIntro) as StepId;
    const stepCopy = modeSteps[baseStep];

    const baseConfig: StepConfig = {
      id: baseStep,
      message: t(stepCopy.messageKey),
      primaryButton: t(stepCopy.primaryButtonKey),
      secondaryButton: stepCopy?.secondaryButtonKey ? t(stepCopy.secondaryButtonKey) : null,
      image: stepCopy?.image,
      lottieSource: stepCopy?.lottieSource,
    };

    switch (baseStep) {
      case JuniorBearStepId.GreetingIntro:
        return {
          ...baseConfig,
          secondaryButton: null,
          onPrimaryPress: () => {
            postHogCapture(POSTHOG_EVENT_NAMES.JUNIOR_BEAR_GREETING_PRIMARY_CLICKED, { mode });
            setCurrentStepId(JuniorBearStepId.AdhdStory);
          },
        };
      case JuniorBearStepId.AdhdStory:
        return {
          ...baseConfig,
          onPrimaryPress: () => {
            postHogCapture(POSTHOG_EVENT_NAMES.JUNIOR_BEAR_ADHD_ACKNOWLEDGED, { mode });
            setCurrentStepId(JuniorBearStepId.TeamUpInvite);
          },
          onSecondaryPress: () => {
            postHogCapture(POSTHOG_EVENT_NAMES.JUNIOR_BEAR_ADHD_NOT_ISSUE, { mode });
            setCurrentStepId(JuniorBearStepId.TeamUpInvite);
          },
        };
      case JuniorBearStepId.TeamUpInvite:
        return {
          ...baseConfig,
          onPrimaryPress: () => {
            postHogCapture(POSTHOG_EVENT_NAMES.JUNIOR_BEAR_TEAM_UP_PRIMARY_CLICKED, { mode });
            setCurrentStepId(JuniorBearStepId.SignupDecision);
          },
          secondaryButton: null,
        };
      case JuniorBearStepId.SignupDecision:
      default:
        return {
          ...baseConfig,
          onPrimaryPress: () => {
            postHogCapture(POSTHOG_EVENT_NAMES.JUNIOR_BEAR_SIGNUP_CLICKED, { mode });
            navigation.replace(NAVIGATION.SignUp);
          },
          onSecondaryPress: () => {
            // Sign in as guest/anonymous
            postHogCapture(POSTHOG_EVENT_NAMES.JUNIOR_BEAR_SIGNIN_AS_GUEST_CLICKED, { mode });
            setIsGuestLoading(true);
            postHogCapture(POSTHOG_EVENT_NAMES.SIGNIN_AS_GUEST);
            dispatch(
              signup(guestEmail, GUEST_PASSWORD, true, () => {
                setIsGuestLoading(false);
              }),
            );
          },
        };
    }
  };

  const currentStepData = getStepConfig();

  const handlePrimaryPress = (): void => {
    if (currentStepData.onPrimaryPress) {
      currentStepData.onPrimaryPress();
    }
  };

  const handleSecondaryPress = (): void => {
    if (currentStepData.onSecondaryPress) {
      currentStepData.onSecondaryPress();
    }
  };

  const handleSkipPress = (): void => {
    postHogCapture(POSTHOG_EVENT_NAMES.JUNIOR_BEAR_SKIP_CLICKED, { mode, stepId: currentStepData.id });
    setCurrentStepId(JuniorBearStepId.SignupDecision);
  };

  const handleBackPress = useCallback((): void => {
    switch (currentStepId) {
      case JuniorBearStepId.AdhdStory:
        setCurrentStepId(JuniorBearStepId.GreetingIntro);
        break;
      case JuniorBearStepId.TeamUpInvite:
        setCurrentStepId(JuniorBearStepId.AdhdStory);
        break;
      case JuniorBearStepId.SignupDecision:
        setCurrentStepId(JuniorBearStepId.TeamUpInvite);
        break;
      default:
        break;
    }
  }, [currentStepId]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (currentStepId !== JuniorBearStepId.GreetingIntro) {
        handleBackPress();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [currentStepId, handleBackPress]);

  const secondaryVariant = useMemo<(typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT]>(() => {
    if (currentStepData.id === JuniorBearStepId.AdhdStory || currentStepData.id === JuniorBearStepId.SignupDecision) {
      return BUTTON_VARIANT.NEUTRAL;
    }
    if (
      (currentStepData.id === JuniorBearStepId.GreetingIntro || currentStepData.id === JuniorBearStepId.TeamUpInvite) &&
      !isPirate
    ) {
      return BUTTON_VARIANT.PIRATE;
    }
    if (isPirate) {
      return BUTTON_VARIANT.PIRATE;
    }
    return BUTTON_VARIANT.CUTE;
  }, [currentStepData.id, isPirate]);

  const speechBubbleWrapperStyle = useMemo(
    () => ({
      marginBottom: isPirate ? -20 : 0,
    }),
    [isPirate],
  );

  // Bring the bubble closer to the bear on the last step.
  // Because the GIF has a lot of space at the top so we have to shift it down.
  const speechBubbleStepStyle = useMemo(() => {
    if (currentStepData.id !== JuniorBearStepId.SignupDecision) {
      return undefined;
    }
    return { marginBottom: -Math.round(clamp(BEAR_HEIGHT * 0.2, 12, 140)) };
  }, [currentStepData.id]);

  const { top, bottom } = useSafeAreaInsets();
  const topHalfHeight = computeTopHalfHeight({ screenHeight, safeAreaTop: top, safeAreaBottom: bottom });
  const topRowGap = Math.round(clamp(topRowHeight * 0.25, 10, 18));
  const containerBackground = isPirate ? COLOR.PIRATE_BACKGROUND : colors.background;
  const topSectionBackground = isPirate ? COLOR.PIRATE_BACKGROUND : colors.background;
  const bottomSectionBackground = isPirate ? COLOR.PIRATE_BACKGROUND : colors.card;

  return (
    <View
      testID={`test:id/junior-bear-conversation-${currentStepData.id}-${mode}`}
      style={[
        styles.container,
        {
          paddingTop: top,
          backgroundColor: containerBackground,
        },
      ]}
    >
      <ScrollView
        key={currentStepData.id}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Half Content */}
        <View
          testID={`test:id/junior-bear-top-content-${currentStepData.id}`}
          style={[
            styles.topHalfContent,
            { minHeight: topHalfHeight, backgroundColor: topSectionBackground, borderColor: colors.separator },
          ]}
        >
          <View
            style={styles.topRow}
            onLayout={(event) => {
              const nextHeight = Math.round(event.nativeEvent.layout.height);
              if (nextHeight > 0 && Math.abs(nextHeight - topRowHeight) >= 1) {
                setTopRowHeight(nextHeight);
              }
            }}
          >
            {currentStepId !== JuniorBearStepId.GreetingIntro && (
              <ProceedButton
                label="Back"
                icon="back"
                align="left"
                onPress={handleBackPress}
                testID="test:id/junior-bear-back"
              />
            )}
            {currentStepId === JuniorBearStepId.GreetingIntro && (
              <ProceedButton
                label="Skip"
                icon="skip"
                align="right"
                onPress={handleSkipPress}
                testID="test:id/junior-bear-skip"
                darkMuted
              />
            )}
          </View>

          <View style={[styles.topContentBody, { paddingTop: topRowGap }]}>
            <SpeechBubble
              message={currentStepData.message}
              isPirate={isPirate}
              style={[
                styles.speechBubbleWrapper,
                speechBubbleWrapperStyle,
                speechBubbleStepStyle,
                currentStepData.lottieSource && styles.speechBubbleWrapperLottie,
              ]}
            />
            {currentStepData.lottieSource ? (
              <LottieView
                testID={`test:id/junior-bear-lottie-${currentStepData.id}`}
                source={currentStepData.lottieSource}
                autoPlay
                loop
                style={[styles.bearImage, isPirate && styles.bearImagePirate, styles.bearLottieLarge]}
                resizeMode="contain"
              />
            ) : (
              <Image
                testID={`test:id/junior-bear-image-${currentStepData.id}`}
                source={currentStepData.image}
                style={[styles.bearImage, isPirate && styles.bearImagePirate]}
                resizeMode="contain"
              />
            )}
          </View>
          {isPirate && (
            <Image
              testID="test:id/junior-bear-wave-background"
              source={WaveBackground}
              style={[styles.waveBackground, { width: screenWidth }]}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Bottom Half Content */}
        <View
          testID={`test:id/junior-bear-bottom-content-${currentStepData.id}`}
          style={[styles.bottomHalfContent, { backgroundColor: bottomSectionBackground }]}
        >
          <View
            testID={`test:id/junior-bear-button-container-${currentStepData.id}`}
            style={[styles.buttonContainer, { paddingBottom: bottom }]}
          >
            {Array.isArray(currentStepData.options) && currentStepData.options.length > 0 ? (
              currentStepData.options.map((opt, index) => (
                <ConversationButton
                  key={opt.key}
                  title={opt.label}
                  onPress={opt.onPress || (() => {})}
                  isSecondary={index > 0}
                  variant={isPirate ? BUTTON_VARIANT.PIRATE : BUTTON_VARIANT.CUTE}
                  testID={`test:id/junior-bear-option-${opt.key}-${currentStepData.id}`}
                  style={styles.fullWidthButton}
                />
              ))
            ) : (
              <>
                {currentStepData.primaryButton && (
                  <ConversationButton
                    title={currentStepData.primaryButton}
                    onPress={handlePrimaryPress}
                    testID="test:id/bear-onboarding-primary"
                    variant={isPirate ? BUTTON_VARIANT.PIRATE : BUTTON_VARIANT.CUTE}
                    style={styles.fullWidthButton}
                  />
                )}
                {currentStepData.secondaryButton && (
                  <ConversationButton
                    title={currentStepData.secondaryButton}
                    onPress={handleSecondaryPress}
                    isSecondary
                    variant={secondaryVariant}
                    testID={`test:id/junior-bear-secondary-${currentStepData.id}`}
                    disabled={isGuestLoading}
                    style={styles.fullWidthButton}
                  />
                )}
              </>
            )}
          </View>

          {currentStepData.id === JuniorBearStepId.GreetingIntro && (
            <View
              testID={`test:id/junior-bear-skip-account-container-${currentStepData.id}`}
              style={[styles.skipAccountButtonContainer, { paddingBottom: bottom }]}
            >
              <TouchableOpacity
                onPress={() => {
                  postHogCapture(POSTHOG_EVENT_NAMES.JUNIOR_BEAR_ALREADY_HAVE_ACCOUNT_CLICKED, {
                    mode,
                    stepId: currentStepData.id,
                  });
                  postHogCapture(POSTHOG_EVENT_NAMES.ALREADY_HAVE_AN_ACCOUNT);
                  navigation.replace(NAVIGATION.SignIn, { returnToOnboarding: true });
                }}
                testID="test:id/already-have-account"
              >
                <BodyLargeText center underline color={colors.subText}>
                  {t("signIn.alreadyHaveAccount")}
                </BodyLargeText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <FullPageLoading show={isGuestLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    zIndex: 20,
    ...(Platform.OS === "android" ? { elevation: 2 } : {}), // elevation is Android-based
  },
  topHalfContent: {
    paddingHorizontal: 32,
    paddingTop: 35,
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    overflow: "visible",
  },
  topContentBody: {
    width: "100%",
    alignItems: "center",
  },
  waveBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30%",
    zIndex: 0,
  },
  bottomHalfContent: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 32,
    justifyContent: "space-between",
    flex: 1,
    zIndex: 10,
    position: "relative",
  },
  speechBubbleWrapper: {},
  bearImage: {
    zIndex: 15,
    width: 200,
    height: 260,
    position: "relative",
    bottom: -25,
  },
  bearImagePirate: {
    zIndex: 5,
    bottom: -45,
  },
  bearLottieLarge: {
    width: 400,
    height: 400,
    position: "relative",
    bottom: -110,
    zIndex: 5,
  },
  buttonContainer: {
    gap: 12,
    paddingTop: 24,
    alignItems: "center",
    width: "100%",
  },
  fullWidthButton: {
    width: "100%",
  },
  skipAccountButtonContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 16,
  },
  speechBubbleWrapperLottie: {
    position: "relative",
    bottom: -150,
  },
});
