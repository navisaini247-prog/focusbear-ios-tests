import React, { useEffect, useRef } from "react";
import { Platform, useColorScheme, View } from "react-native";
import { WebView } from "react-native-webview";
import { webviewRunBeforeFirstScript } from "@/constants";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import { WEB_URL } from "@/utils/Enums";
import { FullPageLoading } from "@/components";
import { useTranslation } from "react-i18next";
import { ACTIVITY } from "@/constants/activity";
import { styles } from "./Stats.styles";
import { useSelector } from "react-redux";

const WEBVIEW_RELOAD_COOLDOWN_MS = 60 * 1000;

export function UserStats() {
  const webViewRef = useRef(null);
  const lastOpenedAtRef = useRef(Date.now());
  const { webContentTheme } = useTheme();
  const { i18n } = useTranslation();
  const scheme = useColorScheme();
  const deviceLanguage = i18n.language; // en or es
  const accessToken = useSelector((state) => state.user?.accessToken);

  useEffect(() => {
    webViewRef?.current?.reload();
    lastOpenedAtRef.current = Date.now();
  }, [scheme]);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      const shouldReload = now - lastOpenedAtRef.current > WEBVIEW_RELOAD_COOLDOWN_MS;

      if (shouldReload) {
        webViewRef?.current?.reload();
        lastOpenedAtRef.current = now;
      }
    }, []),
  );

  const injectedData = {
    access_token: accessToken,
    platform: Platform.OS,
    theme: webContentTheme,
    type: ACTIVITY.mob,
    lang: deviceLanguage,
  };

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

  const onLoadEnd = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(injectJavaScriptStatsView);
    }
  };

  return (
    <View edges={["bottom"]} style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL.STATS }}
        javaScriptEnabled
        injectedJavaScriptBeforeContentLoaded={webviewRunBeforeFirstScript}
        onLoadEnd={onLoadEnd}
        renderLoading={() => <FullPageLoading show />}
        startInLoadingState
      />
    </View>
  );
}
