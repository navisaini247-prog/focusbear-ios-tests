import React, { useRef, useState, useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useRoute, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components";
import { PLATFORMS, webviewRunBeforeFirstScript } from "@/constants";
import { BearLoading } from "@/components/LoadingScreen";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import {
  markCompleteEoSQuestionnaire,
  markCompleteQuestionnaire,
  postUserLocalDeviceSettings,
  setHasCompletedConsentForm,
  setHasCompletedEoSQuestionnaire,
  setHasCompletedQuestionnaire,
} from "@/actions/UserActions";
import { useDispatch } from "react-redux";

export const BEFORE_STUDY_QUESTIONNAIRE_URL = "https://forms.gle/eNqAY9PXNoFFJPzR7";
export const AFTER_STUDY_QUESTIONNAIRE_URL = "https://forms.gle/H4VYbLP3mh9JsjXK9";
export const CONFIRMATION_URL = "https://forms.gle/EAZckfeiwepGgr1x5";

// JavaScript to inject for form submission detection
const formSubmissionDetectionScript = `(function () {
  function checkFormSubmitted() {
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const text = div.textContent || '';
      if (text.includes('¡Gracias por completar el cuestionario!')) {
        // ✅ Fire event or notify native app
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage('formSubmitted');
        } else if (window.AndroidInterface) {
          window.AndroidInterface.onFormSubmitted();
        } else {
          console.log('✅ Google Form submitted!');
        }
        return; // Stop checking once found
      }
    }
    setTimeout(checkFormSubmitted, 500); // Keep checking
  }

  // Start checking after a short delay
  setTimeout(checkFormSubmitted, 1000);
})();`;

export function Questionnaire({ navigation }) {
  const webViewRef = useRef(null);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [startLoading, setStartLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const dispatch = useDispatch();
  const route = useRoute() as {
    params: {
      url: string;
    };
  };
  const url = route?.params?.url || "";

  const onLoadEnd = useCallback(() => {
    setStartLoading(false);
  }, []);

  const handleMessage = useCallback(
    (event) => {
      try {
        if (event.nativeEvent.data === "formSubmitted") {
          switch (url) {
            case BEFORE_STUDY_QUESTIONNAIRE_URL:
              markCompleteQuestionnaire();
              dispatch(setHasCompletedQuestionnaire(true));
              dispatch(postUserLocalDeviceSettings({ hasCompletedQuestionnaire: true }, PLATFORMS.MACOS));
              postHogCapture(POSTHOG_EVENT_NAMES.QUESTIONNAIRE_COMPLETED);
              navigation.goBack();
              break;
            case AFTER_STUDY_QUESTIONNAIRE_URL:
              markCompleteEoSQuestionnaire();
              dispatch(setHasCompletedEoSQuestionnaire(true));
              dispatch(postUserLocalDeviceSettings({ hasCompletedEoSQuestionnaire: true }, PLATFORMS.MACOS));
              postHogCapture(POSTHOG_EVENT_NAMES.EOS_QUESTIONNAIRE_COMPLETED);
              navigation.goBack();
              break;
            case CONFIRMATION_URL:
              dispatch(setHasCompletedConsentForm(true));
              dispatch(postUserLocalDeviceSettings({ hasCompletedConsentForm: true }, PLATFORMS.MACOS));
              postHogCapture(POSTHOG_EVENT_NAMES.CONSENT_FORM_COMPLETED);
              navigation.goBack();
              break;
          }
        }
      } catch (error) {
        console.error("Error parsing WebView message:", error);
      }
    },
    [dispatch, navigation, url],
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    webView: {
      minHeight: 200,
    },
  });

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <AppHeader title={t("questionnaire.title")} />
      <WebView
        androidLayerType="hardware"
        ref={webViewRef}
        source={{ uri: url }}
        javaScriptEnabled
        injectedJavaScriptBeforeContentLoaded={webviewRunBeforeFirstScript}
        injectedJavaScript={formSubmissionDetectionScript}
        onMessage={handleMessage}
        onLoadEnd={onLoadEnd}
        cacheEnabled={true}
        pullToRefreshEnabled
        useWebView2
        style={styles.webView}
        onLoadProgress={(event) => {
          setLoadingProgress(event.nativeEvent.progress);
          if (event.nativeEvent.progress >= 0.95) {
            setStartLoading(false);
          }
        }}
      />
      <BearLoading
        loadingText={t("questionnaire.loadingQuestionnaire")}
        visible={startLoading}
        progress={checkIsAndroid() ? undefined : loadingProgress}
      />
    </SafeAreaView>
  );
}
