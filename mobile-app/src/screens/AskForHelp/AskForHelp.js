import React, { useState, useRef, useCallback, useEffect } from "react";
import { Platform, StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { webviewBlockIOSReturnKeyJS, webviewRunBeforeFirstScript } from "@/constants";
import { useTheme } from "@react-navigation/native";
import { WEB_URL } from "@/utils/Enums";
import { useSelector } from "react-redux";
import { AppHeader } from "@/components";
import { ACTIVITY } from "@/constants/activity";
import { useTranslation } from "react-i18next";
import useFetchInstalledApps from "@/hooks/use-fetch-installed-apps";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { BearLoading } from "@/components/LoadingScreen";

export function AskForHelp({ navigation }) {
  const webViewRef = useRef(null);
  const webviewUrlRef = useRef(WEB_URL.WEBVIEW_GET_SUPPORT);

  const { webContentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const accessToken = useSelector((state) => state.user?.accessToken);

  const deviceLanguage = i18n.language; // en or es
  const { installedApps } = useFetchInstalledApps();
  const [startLoading, setStartLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    webViewRef.current?.injectJavaScript(`window?.syncThemeWithOtherApps("${webContentTheme}");`);
  }, [webContentTheme]);

  const onLoadEnd = useCallback(() => {
    setStartLoading(false);
    if (webViewRef.current) {
      const installedAppsScript = ` const loadInstalledAppsInterval = setInterval(() => {
          if (window.LoadInstalledApps) {
            const data = ${JSON.stringify((installedApps ?? [])?.map((app) => app.packageName))};
            const response = window?.LoadInstalledApps(data);
            if (response === 'ok') {
              clearInterval(loadInstalledAppsInterval);
            }
          }
        }, 100);`;

      const metaData = {
        access_token: accessToken,
        platform: Platform.OS,
        theme: webContentTheme,
        lang: deviceLanguage,
        type: ACTIVITY.mob,
      };

      const metaDataScript = `const loadSettingsInterval = setInterval(() => {
         if (window.loadSettingsData) {
           const data = ${JSON.stringify(metaData ?? {})};
           const response = window?.loadSettingsData(data);
           if (response === 'ok') {
             clearInterval(loadSettingsInterval);
           }
         }
       }, 100);`;

      webViewRef.current.injectJavaScript(`${installedAppsScript} ${metaDataScript} ${webviewBlockIOSReturnKeyJS}`);
    }
  }, [webViewRef.current, webContentTheme]);

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <AppHeader title={t("settings.askForHelp")} />
        <WebView
          androidLayerType="hardware"
          ref={webViewRef}
          source={{ uri: WEB_URL.WEBVIEW_GET_SUPPORT }}
          javaScriptEnabled
          injectedJavaScriptBeforeContentLoaded={webviewRunBeforeFirstScript}
          onLoadEnd={onLoadEnd}
          cacheEnabled={true}
          pullToRefreshEnabled
          useWebView2
          style={styles.webView}
          onNavigationStateChange={(state) => {
            webviewUrlRef.current = state.url;
          }}
          onLoadProgress={(event) => {
            setLoadingProgress(event.nativeEvent.progress);
            if (event.nativeEvent.progress >= 0.95) {
              setStartLoading(false);
            }
          }}
        />
        {/**
         * for android progress is disabled because the animation is not as smooth as iOS, it was flickering so I fake it with a determinate progress bar
         */}
        <BearLoading
          loadingText={t("loading.loadingHabit")}
          visible={startLoading}
          progress={checkIsAndroid() ? undefined : loadingProgress}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    minHeight: 200,
  },
});
