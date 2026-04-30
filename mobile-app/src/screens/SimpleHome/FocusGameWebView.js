import React, { useCallback, useMemo, useState } from "react";
import { useNavigation, useTheme } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { AppHeader, ConfirmationModal } from "@/components";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { NAVIGATION } from "@/constants";

const detectionScript = `(() => {
  const TARGET_TEXT = 'Task Results';
  function found() {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('setNewGoalButtonDetected');
    }
  }
  function check() {
    try {
      const elements = document.querySelectorAll('button, a, div, span');
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const text = (el.innerText || el.textContent || '').trim();
        if (text.includes(TARGET_TEXT)) {
          found();
          return true;
        }
      }
      return false;
    } catch (_) { return false; }
  }
  if (!check()) {
    const obs = new MutationObserver(() => { if (check()) { obs.disconnect(); } });
    obs.observe(document.documentElement || document.body, { childList: true, subtree: true, characterData: true });
    setTimeout(() => { obs.disconnect(); }, 30000);
  }
})();`;

export function FocusGameWebView({ onClose }) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [showPrompt, setShowPrompt] = useState(false);

  const handleMessage = useCallback((event) => {
    try {
      if (event?.nativeEvent?.data === "setNewGoalButtonDetected") {
        setShowPrompt(true);
      }
    } catch (_) {
      /* empty */
    }
  }, []);

  const headerTitle = useMemo(() => t("simpleHome.focusGameTitle"), [t]);
  const modalTitle = useMemo(() => t("simpleHome.postGamePromptTitle"), [t]);
  const modalText = useMemo(() => t("simpleHome.postGamePromptText"), [t]);
  const laterText = useMemo(() => t("common.later"), [t]);
  const yesText = useMemo(() => t("simpleHome.focusNowCta"), [t]);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={headerTitle} onBackPress={onClose} />
      <View style={styles.container}>
        <WebView
          source={{ uri: "https://bear-task-sort.vercel.app/" }}
          startInLoadingState
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          androidLayerType="hardware"
          bounces={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          injectedJavaScript={detectionScript}
          onMessage={handleMessage}
        />
      </View>
      {showPrompt && (
        <ConfirmationModal
          isVisible={showPrompt}
          title={modalTitle}
          text={modalText}
          cancelTitle={laterText}
          confirmTitle={yesText}
          onCancel={() => {
            setShowPrompt(false);
            onClose && onClose();
          }}
          onConfirm={() => {
            setShowPrompt(false);
            onClose && onClose();
            navigation.navigate(NAVIGATION.NonTabFocus, { fromInduction: true });
          }}
        />
      )}
    </View>
  );
}

FocusGameWebView.propTypes = {
  onClose: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default FocusGameWebView;
