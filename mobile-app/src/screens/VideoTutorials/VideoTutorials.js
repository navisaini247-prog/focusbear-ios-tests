import React, { useEffect, useRef } from "react";
import { Platform, useColorScheme, Alert, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { webviewRunBeforeFirstScript } from "@/constants";
import { useNavigation, useTheme } from "@react-navigation/native";
import { WEB_URL } from "@/utils/Enums";
import { useSelector } from "react-redux";
import { AppHeader, FullPageLoading } from "@/components";
import { ACTIVITY } from "@/constants/activity";
import { useTranslation } from "react-i18next";
import { logSentryError } from "@/utils/Posthog";

export const VideoTutorials = () => {
  const webViewRef = useRef(null);
  const { colors, webContentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme();
  const accessToken = useSelector((state) => state.user?.accessToken);
  const navigation = useNavigation();
  const deviceLanguage = i18n.language; // en or es

  useEffect(() => {
    webViewRef?.current?.reload();
  }, [scheme]);

  const injectedData = {
    access_token: accessToken,
    platform: Platform.OS,
    theme: webContentTheme,
    lang: deviceLanguage,
    type: ACTIVITY.mob,
  };

  const injectConfigJavaScript = `
  const loadSettingsInterval = setInterval(() => {
    if (window.loadMetaDataForEnrolledCourses) {
      const data = ${JSON.stringify(injectedData)};
      const response = window.loadMetaDataForEnrolledCourses(data);
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

  const handleOnMessage = (event) => {
    const settings = JSON.parse(event.nativeEvent.data);
    if (!Object.values(settings).length) {
      Alert.alert(t("editHabit.error"), t("editHabit.unableToSaveSettings"), [
        {
          text: t("editHabit.okay"),
          onPress: () => webViewRef.current?.reload(),
        },
      ]);
      logSentryError(JSON.stringify(event.nativeEvent));
    }
  };
  return (
    <View style={styles.container}>
      <AppHeader title={t("settings.videoTutorials")} />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL.VIDEO_TUTORIALS }}
        javaScriptEnabled
        injectedJavaScriptBeforeContentLoaded={webviewRunBeforeFirstScript}
        onLoadEnd={onLoadEnd}
        renderLoading={() => <FullPageLoading show />}
        startInLoadingState
        onMessage={handleOnMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
