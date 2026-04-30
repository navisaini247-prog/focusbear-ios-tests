import React, { useEffect, useMemo, useRef } from "react";
import { Linking, ScrollView, View, Image } from "react-native";
import { PressableWithFeedback, DisplaySmallText, HeadingMediumText, Space } from "@/components";
import { useNavigation, useTheme } from "@react-navigation/native";
import { styles } from "./SimpleHome.styles";
import { useSelector } from "react-redux";
import { NAVIGATION } from "@/constants";
import { OptionContainer } from "../OnBoarding/Goals";
import {
  onboardingMicroBreakFlagSelector,
  onboardingStartFocusSessionFlagSelector,
  focusGameCompletedFlagSelector,
  isPushNotificationAskedStatusSelector,
} from "@/selectors/GlobalSelectors";
import { QUICK_BREAKS } from "@/constants/quickBreaks";
import { useTranslation } from "react-i18next";
import WelcomeBear10 from "@/assets/bears/welcome-bear-10.png";
import PirateBear10 from "@/assets/bears/pirate-bear-10.png";
import { useHomeContext } from "../Home/context";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export function SimpleHome() {
  const navigation = useNavigation();
  const { colors, shadowStyles } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    isOverlayPermissionGranted,
    isUsagePermissionGranted,
    isAccessibilityPermissionGranted,
    isScreenTimePermissionGranted,
    isPushNotificationPermissionGranted,
  } = useHomeContext();

  const isPushNotificationPermissionAsked = useSelector(isPushNotificationAskedStatusSelector);
  const onboardingFocusSessionFlag = useSelector(onboardingStartFocusSessionFlagSelector);
  const onboardingMicroBreakFlag = useSelector(onboardingMicroBreakFlagSelector);
  const focusGameCompletedFlag = useSelector(focusGameCompletedFlagSelector);

  const isAllDone = useMemo(() => {
    return onboardingFocusSessionFlag && onboardingMicroBreakFlag;
  }, [onboardingFocusSessionFlag, onboardingMicroBreakFlag]);

  const toFocusScreen = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.SIMPLE_HOME_START_FOCUS_SESSION_CLICKED);
    navigation.navigate(NAVIGATION.NonTabFocus, { fromInduction: true });
  };

  const toQuickBreak = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.SIMPLE_HOME_START_MICRO_BREAK_CLICKED);
    const habit = QUICK_BREAKS[0];
    navigation.navigate(NAVIGATION.RoutineDetail, {
      item: {
        ...habit,
        id: `${habit.id}_${Date.now()}`, // Unique ID necessary for unlimited uses
        name: t(`quickBreak.${habit.nameLanguageKey}`),
      },
      isQuickBreak: true,
    });
  };

  const handleContinue = () => {
    if (isAllDone) {
      postHogCapture(POSTHOG_EVENT_NAMES.SIMPLE_HOME_CONTINUE_CLICKED, {
        completedFlags: {
          blockingApp: isSetupBlockingAppCompleted,
          accessibility: checkIsAndroid() ? isAccessibilityPermissionGranted : false,
          focusGame: focusGameCompletedFlag,
          focusSession: onboardingFocusSessionFlag,
          microBreak: onboardingMicroBreakFlag,
          notifications: isPushNotificationPermissionGranted,
        },
      });
    } else {
      postHogCapture(POSTHOG_EVENT_NAMES.SIMPLE_HOME_DO_IT_LATER_CLICKED, {
        completedFlags: {
          blockingApp: isSetupBlockingAppCompleted,
          accessibility: checkIsAndroid() ? isAccessibilityPermissionGranted : false,
          focusGame: focusGameCompletedFlag,
          focusSession: onboardingFocusSessionFlag,
          microBreak: onboardingMicroBreakFlag,
          notifications: isPushNotificationPermissionGranted,
        },
      });
    }
    navigation.reset({ index: 0, routes: [{ name: NAVIGATION.TabNavigator }] });
  };

  const setupBlockingUrl = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.SIMPLE_HOME_SETUP_BLOCKING_URL_CLICKED);
    navigation.navigate(NAVIGATION.BlockUrl, { fromInduction: true });
  };

  const setupBlockingApp = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.SIMPLE_HOME_SETUP_BLOCKING_APP_CLICKED);
    navigation.navigate(NAVIGATION.PermissionExplanation);
  };

  const setupNotifApp = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.SIMPLE_HOME_SETUP_NOTIF_APP_CLICKED, {
      isPermissionAsked: isPushNotificationPermissionAsked,
    });
    if (!isPushNotificationPermissionAsked) {
      navigation.navigate(NAVIGATION.PushNotificationScreen, { isFromSignin: false });
    } else {
      Linking.openSettings();
    }
  };

  const isSetupBlockingAppCompleted = checkIsAndroid()
    ? isOverlayPermissionGranted && isUsagePermissionGranted
    : isScreenTimePermissionGranted;

  const juniorBearMode = useSelector((state) => state.global?.juniorBearMode) || "normal";
  const isPirate = juniorBearMode === "pirate";
  const bearImage = isPirate ? PirateBear10 : WelcomeBear10;

  // Compute completed steps for tracking
  const completedFlags = [
    isSetupBlockingAppCompleted,
    checkIsAndroid() ? isAccessibilityPermissionGranted : false,
    onboardingFocusSessionFlag,
    onboardingMicroBreakFlag,
    isPushNotificationPermissionGranted,
  ];
  const numCompleted = completedFlags.filter(Boolean).length;
  const hasTrackedScreenOpen = useRef(false);

  useEffect(() => {
    if (!hasTrackedScreenOpen.current) {
      postHogCapture(POSTHOG_EVENT_NAMES.SIMPLE_HOME_SCREEN_OPENED, {
        completedFlags: {
          blockingApp: isSetupBlockingAppCompleted,
          accessibility: checkIsAndroid() ? isAccessibilityPermissionGranted : false,
          focusGame: focusGameCompletedFlag,
          focusSession: onboardingFocusSessionFlag,
          microBreak: onboardingMicroBreakFlag,
          notifications: isPushNotificationPermissionGranted,
        },
        numCompleted,
        isAllDone,
      });
      hasTrackedScreenOpen.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <ScrollView style={[styles.container, styles.flex]} contentContainerStyle={{ paddingBottom: bottom + 40 }}>
        <View style={styles.contentContainer}>
          <View style={styles.bearsonaContainer}>
            <Image source={bearImage} style={styles.bearImage} resizeMode="contain" />
          </View>
          <View style={styles.checkboxesContainer}>
            <DisplaySmallText>{t("simpleHome.setupBlocking")}</DisplaySmallText>
            <OptionContainer
              title={t("simpleHome.setupBlockingApp")}
              isSelected={isSetupBlockingAppCompleted}
              onClickGoal={setupBlockingApp}
              testID="test:id/setup-blocking-app"
            />
            <OptionContainer
              title={t("pushNotiPermission.title")}
              isSelected={isPushNotificationPermissionGranted}
              description={t("pushNotiPermission.description")}
              onClickGoal={setupNotifApp}
              testID="test:id/setup-notif-app"
            />
            {checkIsAndroid() && (
              <OptionContainer
                title={t("simpleHome.setupBlockingUrl")}
                isSelected={isAccessibilityPermissionGranted}
                onClickGoal={setupBlockingUrl}
                testID="test:id/setup-blocking-url"
              />
            )}
            <Space height={8} />
            <DisplaySmallText>{t("simpleHome.title")}</DisplaySmallText>
            <OptionContainer
              title={t("simpleHome.focusSessionCheckboxTitle")}
              description={t("simpleHome.focusSessionCheckboxDesc")}
              isSelected={onboardingFocusSessionFlag}
              onClickGoal={toFocusScreen}
              testID="test:id/start-focus-session"
            />
            <OptionContainer
              title={t("simpleHome.microBreakCheckboxTitle")}
              description={t("simpleHome.microBreakCheckboxDesc")}
              isSelected={onboardingMicroBreakFlag}
              onClickGoal={toQuickBreak}
              testID="test:id/start-micro-break"
            />
          </View>
        </View>
      </ScrollView>
      <View
        style={[
          styles.buttonContainer,
          shadowStyles.shadow,
          { backgroundColor: colors.card, borderTopColor: colors.separator, paddingBottom: bottom + 16 },
        ]}
      >
        <PressableWithFeedback onPress={handleContinue} testID="test:id/continue-or-do-it-later">
          <HeadingMediumText underline center color={isAllDone ? colors.text : colors.subText}>
            {isAllDone ? t("common.continue") : t("common.doItLater")}
          </HeadingMediumText>
        </PressableWithFeedback>
      </View>
    </SafeAreaView>
  );
}
