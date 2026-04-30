import React, { useRef, useEffect } from "react";
import { StyleSheet, Platform } from "react-native";
import { SheetModal, ModalHeader, FullPageLoading } from "@/components";
import WebView, { WebViewNavigation } from "react-native-webview";
import { WEB_URL } from "@/utils/Enums";
import { webviewRunBeforeFirstScript } from "@/constants";
import { useSelector } from "react-redux";
import { ACTIVITY } from "@/constants/activity";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

/** Trusted origin for the notes WebView — navigation is restricted to this host. */
const NOTES_TRUSTED_ORIGIN = "https://dashboard.focusbear.io";

interface NotesWebViewModalProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  titleKey: string;
}

/**
 * Shared modal component that renders the Focus Bear notes WebView.
 * Navigation within the WebView is restricted to the trusted origin
 * (`https://dashboard.focusbear.io`) to prevent token leakage.
 */
export const NotesWebViewModal = React.memo(function NotesWebViewModal({
  isVisible,
  setIsVisible,
  titleKey,
}: NotesWebViewModalProps) {
  const { webContentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const webViewRef = useRef<WebView>(null);
  const accessToken = useSelector((state: any) => state.user?.accessToken);
  const deviceLanguage = i18n.language;

  const injectedData = {
    access_token: accessToken,
    platform: Platform.OS,
    theme: webContentTheme,
    lang: deviceLanguage,
    type: ACTIVITY.mob,
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    webViewRef.current?.injectJavaScript(`window?.syncThemeWithOtherApps("${webContentTheme}");`);
  }, [isVisible, webContentTheme]);

  const injectConfigJavaScript = `
  (function() {
    let retries = 0;
    const data = ${JSON.stringify(injectedData)};
    const loadSettingsInterval = setInterval(() => {
      if (window.loadSettingsData) {
        const response = window.loadSettingsData(data);
        if (response === "ok") {
          clearInterval(loadSettingsInterval);
        }
      }

      retries += 1;
      if (retries > 50) {
        clearInterval(loadSettingsInterval);
      }
    }, 100);
  })();
`;

  const onLoadEnd = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(injectConfigJavaScript);
    }
  };

  /**
   * Restrict navigation to the trusted origin only.
   * This prevents the accessToken from being exfiltrated if the WebView
   * is somehow redirected to an untrusted URL.
   */
  const onShouldStartLoadWithRequest = (request: WebViewNavigation): boolean => {
    try {
      return new URL(request.url).origin === NOTES_TRUSTED_ORIGIN;
    } catch {
      return false;
    }
  };

  return (
    <SheetModal
      isVisible={isVisible}
      onCancel={() => setIsVisible(false)}
      style={styles.modal}
      HeaderComponent={<ModalHeader title={t(titleKey)} />}
      CustomScrollView={
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_URL.NOTES }}
          javaScriptEnabled
          injectedJavaScriptBeforeContentLoaded={webviewRunBeforeFirstScript}
          onLoadEnd={onLoadEnd}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          startInLoadingState
          style={styles.webview}
          renderLoading={() => <FullPageLoading show />}
        />
      }
    />
  );
});

const styles = StyleSheet.create({
  modal: {
    height: "80%",
  },
  webview: {
    flex: 1,
  },
});
