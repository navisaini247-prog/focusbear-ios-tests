import React, { useRef, useEffect, useCallback, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { NAVIGATION, webviewBlockIOSReturnKeyJS, webviewRunBeforeFirstScript } from "@/constants";
import { AppHeader, BodyLargeText } from "@/components";
import { ACTIVITY } from "@/constants/activity";
import WebView from "react-native-webview";
import { WEB_URL } from "@/utils/Enums";
import { getInstalledHabitPack, storeHabitPack } from "@/actions/UserActions";
import { userRoutineDataAction } from "@/actions/RoutineActions";
import { useForegroundColorScheme } from "@/hooks/use-foreground-color-scheme";
import { safeParse, safeStringify } from "@/utils/StringMethods";
import { ON_BOARDING_POST_MESSAGE_EVENT } from "@/constants/events";
import { BearLoading } from "@/components/LoadingScreen";
import { checkIsAndroid } from "@/utils/PlatformMethods";

export function HabitPack() {
  const webViewRef = useRef(null);
  const { webContentTheme } = useTheme();
  const { i18n } = useTranslation();
  const navigation = useNavigation();
  const scheme = useForegroundColorScheme();
  const { t } = useTranslation();
  const deviceLanguage = i18n.language; // en or es
  const accessToken = useSelector((state) => state.user?.accessToken);
  const onboardingGoals = useSelector((state) => state.global.onboardingGoals ?? []);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const dispatch = useDispatch();
  useEffect(() => {
    webViewRef.current?.reload();
  }, [scheme]);

  const fetchInstalledHabitPacksAndRoutineData = useCallback(() => {
    dispatch(getInstalledHabitPack()).then((installedHabitPacks) => {
      if (installedHabitPacks) {
        dispatch(storeHabitPack(installedHabitPacks));
      }
    });
    dispatch(userRoutineDataAction());
  }, []);

  const onLoadEnd = () => {
    const injectJavaScriptStatsView = `
    const loadSettingsInterval = setInterval(() => {
        if (window.loadMetaDataForRoutineSuggestion) {
        const data = ${safeStringify({
          access_token: accessToken,
          platform: Platform.OS,
          theme: webContentTheme,
          type: ACTIVITY.mob,
          lang: deviceLanguage,
          long_term_goals: [...onboardingGoals],
        })};
        const response = window.loadMetaDataForRoutineSuggestion(data);
        if (response === 'ok') {
            clearInterval(loadSettingsInterval);
        }
        }
    }, 100);
`;
    webViewRef.current?.injectJavaScript(`${injectJavaScriptStatsView} ${webviewBlockIOSReturnKeyJS}`);
    setLoading(false);
  };

  const handleOnMessage = (event) => {
    const message = safeParse(event.nativeEvent.data);

    switch (message.event) {
      case ON_BOARDING_POST_MESSAGE_EVENT.INVOKE_FUNCTION:
        onLoadEnd();
        break;
      case ON_BOARDING_POST_MESSAGE_EVENT.SEND_SELECTED_HABIT_PACK_ID:
      case ON_BOARDING_POST_MESSAGE_EVENT.SUGGESTED_ACTIVITIES_INSTALLED:
      case ON_BOARDING_POST_MESSAGE_EVENT.ROUTINE_SUGGESTIONS_INSTALLED_SUCCESSFULLY:
        navigation.replace(NAVIGATION.TimeSetup);
        break;
      default:
        break;
    }
    fetchInstalledHabitPacksAndRoutineData();
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Toolbar />
      <WebView
        androidLayerType="hardware"
        ref={webViewRef}
        source={{ uri: WEB_URL.HABIT_SUGGESTION }}
        javaScriptEnabled
        injectedJavaScriptBeforeContentLoaded={webviewRunBeforeFirstScript}
        onLoadEnd={onLoadEnd}
        onMessage={handleOnMessage}
        renderLoading={() => null}
        useWebView2
        style={styles.webview}
        onLoadProgress={(event) => {
          setLoadingProgress(event.nativeEvent.progress);
          if (event.nativeEvent.progress >= 0.95) {
            setLoading(false);
          }
        }}
      />
      {/**
       * for android progress is disabled because the animation is not as smooth as iOS, it was flickering so I fake it with a determinate progress bar
       */}
      <BearLoading
        visible={loading}
        progress={checkIsAndroid() ? undefined : loadingProgress}
        loadingText={t("loading.loadingHabit")}
        loadingSubtitle={t("loading.pleaseWaitLoadHabit")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: {
    flex: 1,
    minHeight: 200,
  },
});

const Toolbar = () => {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const onSkipButtonPress = () => {
    navigation.replace(NAVIGATION.SimplifiedSchedule);
    dispatch(getInstalledHabitPack()).then((installedHabitPacks) => {
      if (installedHabitPacks) {
        dispatch(storeHabitPack(installedHabitPacks));
      }
    });
    dispatch(userRoutineDataAction());
  };

  return (
    <AppHeader
      title={t("habit.habitPack")}
      rightContent={
        <TouchableOpacity onPress={onSkipButtonPress} hitSlop={10} testID="test:id/habit-pack-skip-button">
          <BodyLargeText style={styles.skipButton} color={colors.primary}>
            {t("common.skip")}
          </BodyLargeText>
        </TouchableOpacity>
      }
      hideBackButton
    />
  );
};
