import React, { useRef, useMemo, useState } from "react";
import { View, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { NAVIGATION, webviewRunBeforeFirstScript } from "@/constants";
import { useRoute, useTheme } from "@react-navigation/native";
import { WEB_URL, WATCH_ACTIVITY } from "@/utils/Enums";
import { AppHeader, ConfirmationButton } from "@/components";
import { useTranslation } from "react-i18next";
import { ACTIVITY } from "@/constants/activity";
import { styles as customStyles } from "./styles";
import { useWatchListener } from "@/hooks/use-watch-listener";
import { useDispatch, useSelector } from "react-redux";
import { updateMotivationMessageShown } from "@/actions/UserActions";
import { BearLoading } from "@/components/LoadingScreen";

export function MotivationalSummary({ navigation }) {
  const dispatch = useDispatch();
  const webViewRef = useRef(null);
  const { colors, webContentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const route = useRoute();
  const styles = useMemo(() => customStyles(colors), [colors]);
  const deviceLanguage = i18n.language; // en or es
  const accessToken = useSelector((state) => state.user?.accessToken);
  const [startLoading, setStartLoading] = useState(true);

  const iosListenerCallback = (message) => {
    if (message?.sendDataToRN == t("common.startRoutine")) {
      onClickStartRoutine();
    }
  };

  const androidListenerCallback = (value) => {
    if (value[WATCH_ACTIVITY.MESSAGE] == t("common.startRoutine")) {
      onClickStartRoutine();
    }
  };

  useWatchListener({
    androidListenerCallback,
    iosListenerCallback,
  });

  const onLoadEnd = () => {
    setStartLoading(false);
    if (webViewRef.current) {
      const injectedData = {
        access_token: accessToken,
        type: ACTIVITY.mob,
        platform: Platform.OS,
        theme: webContentTheme,
        lang: deviceLanguage,
      };

      if (route?.params?.name !== t("home.stats")) {
        //motivational message will show
        injectedData.motivation_type = "mobile";
      }

      const injectJavaScriptStatsView = `
      const loadSettingsInterval = setInterval(() => {
        if (window.loadAccessTokenForStats) {
          const data = ${JSON.stringify(injectedData)};
          const response = window.loadAccessTokenForStats(data);
          if (response === 'ok') {
            clearInterval(loadSettingsInterval);
          }
        }
      }, 100);
    `;

      const injectJavaScriptMotivationView = `
      const loadSettingsInterval = setInterval(() => {
        if (window.loadAccessTokenForInspirationPage) {
          const data = ${JSON.stringify(injectedData)};
          const response = window.loadAccessTokenForInspirationPage(data);
          if (response === 'ok') {
            clearInterval(loadSettingsInterval);
          }
        }
      }, 100);
    `;

      webViewRef.current.injectJavaScript(
        route?.params?.name === t("home.stats") ? injectJavaScriptStatsView : injectJavaScriptMotivationView,
      );
    }
  };

  const onClickStartRoutine = () => {
    dispatch(updateMotivationMessageShown(true));
    navigation.getParent()?.setOptions({ tabBarStyle: { display: undefined } });
    navigation.navigate(NAVIGATION.TabNavigator, {});
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t("home.getMotivated")} />
      <View style={styles.container}>
        <WebView
          androidLayerType="hardware"
          ref={webViewRef}
          source={{
            uri: WEB_URL.MOTIVATION,
          }}
          javaScriptEnabled
          injectedJavaScriptBeforeContentLoaded={webviewRunBeforeFirstScript}
          onLoadEnd={onLoadEnd}
          style={styles.webView}
          onLoadProgress={(event) => {
            if (event.nativeEvent.progress > 0.9) {
              setStartLoading(false);
            }
          }}
          cacheEnabled
          useWebView2
        />

        <BearLoading visible={startLoading} />

        {!startLoading && (
          <ConfirmationButton
            confirmTitle={t("editHabit.continue")}
            confirmTestID="test:id/stats-start-routine"
            onConfirm={onClickStartRoutine}
          />
        )}
      </View>
    </View>
  );
}
