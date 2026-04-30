import { StyleSheet, Platform, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useRef } from "react";
import { FullPageLoading } from "@/components";
import WebView from "react-native-webview";
import { WEB_URL } from "@/utils/Enums";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components";
import { ACTIVITY } from "@/constants/activity";
import { webviewRunBeforeFirstScript } from "@/constants";
import { useSelector } from "react-redux";
import COLOR from "@/constants/color";
import { useTheme } from "@react-navigation/native";

export function PrivacyTerms({ route, navigation }) {
  const { webContentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { isFrom } = route.params;
  const deviceLanguage = i18n.language; // en or es

  const urlToLoad =
    isFrom === t("common.termsOfUse")
      ? deviceLanguage === "es"
        ? WEB_URL.TERMS_CONDITIONS_ES
        : WEB_URL.TERMS_CONDITIONS
      : deviceLanguage === "es"
        ? WEB_URL.PRIVACY_POLICY_ES
        : WEB_URL.PRIVACY_POLICY;

  const webViewRef = useRef(null);
  const scheme = useColorScheme();
  const accessToken = useSelector((state) => state.user?.accessToken);

  const injectedData = {
    access_token: accessToken,
    platform: Platform.OS,
    theme: webContentTheme,
    lang: deviceLanguage,
    type: ACTIVITY.mob,
  };

  useEffect(() => {
    webViewRef?.current?.reload();
  }, [scheme]);

  const injectConfigJavaScript = `
  const loadSettingsInterval = setInterval(() => {
    if (window.loadSettingsData) {
      const data = ${JSON.stringify(injectedData)};
      const response = window.loadSettingsData(data);
      if (response === 'ok') {
        clearInterval(loadSettingsInterval);
      }
    }
  }, 100);
`;

  const onLoadEnd = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(injectConfigJavaScript);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <AppHeader title={isFrom} titleStyle={styles.titleStyle} />
      <WebView
        ref={webViewRef}
        source={{ uri: urlToLoad }}
        javaScriptEnabled
        injectedJavaScriptBeforeContentLoaded={webviewRunBeforeFirstScript}
        onLoadEnd={onLoadEnd}
        startInLoadingState
        style={styles.container}
        renderLoading={() => <FullPageLoading show />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.TRANSPARENT,
    justifyContent: "center",
  },
  titleStyle: {
    textTransform: "capitalize",
  },
});
