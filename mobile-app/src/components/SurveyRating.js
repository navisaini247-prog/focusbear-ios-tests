import React, { useEffect, useState, useRef, memo } from "react";
import { Platform, useColorScheme, StyleSheet } from "react-native";
import { Modal } from "@/components";
import { useTheme } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { webviewRunBeforeFirstScript } from "@/constants";
import { WEB_URL } from "@/utils/Enums";
import { useDispatch } from "react-redux";
import { FullPageLoading } from "@/components";
import { ACTIVITY } from "@/constants/activity";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react-native";
import moment from "moment";
import { showSurveyModalStatusSelector, userLoginTimeSelector } from "@/selectors/GlobalSelectors";
import { showSurveyModal } from "@/actions/GlobalActions";
import { addErrorLog } from "@/utils/FileLogger";
import { useSelector } from "@/reducers";
import { useInAppReview } from "@/hooks/useInAppReview";

const CLOSE_SURVEY_UI = "close-survey-ui";

const SurveyRating = () => {
  const webViewRef = useRef(null);
  const scheme = useColorScheme();
  const { webContentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const accessToken = useSelector((state) => state.user?.accessToken);
  const [isVisible, setIsVisible] = useState(false);
  const dispatch = useDispatch();
  const userLoginTime = useSelector(userLoginTimeSelector);
  const currentDate = moment();
  const deviceLanguage = i18n.language; // en or es

  const { isAvailable, requestReview } = useInAppReview();

  const shouldShowSurveyModal = useSelector(showSurveyModalStatusSelector);
  const triggerSurveyTime = moment(userLoginTime).add(3, "days");

  useEffect(() => {
    webViewRef?.current?.reload();
  }, [scheme]);

  useEffect(() => {
    if (currentDate.isAfter(triggerSurveyTime) && shouldShowSurveyModal) {
      setIsVisible(true);
    }
  }, []);

  const injectedData = {
    access_token: accessToken,
    platform: Platform.OS,
    theme: webContentTheme,
    lang: deviceLanguage,
    type: ACTIVITY.mob,
  };

  const injectJavaScript = `
  const loadSettingsInterval = setInterval(() => {
    if (window.loadAccessTokenForSurvey) {
      const data = ${JSON.stringify(injectedData)};
      const response = window.loadAccessTokenForSurvey(data);
      if (response === 'ok') {
        clearInterval(loadAccessTokenForSurvey);
      }
    }
  }, 100);
`;

  const onLoadEnd = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(injectJavaScript);
    }
  };

  const handleOnMessage = (event) => {
    try {
      const message = event.nativeEvent.data;

      if (message === CLOSE_SURVEY_UI) {
        setIsVisible(false);
        dispatch(showSurveyModal(false));
      } else {
        try {
          const rating = JSON.parse(message).rating;
          if (rating >= 4) {
            requestReview();
          }
        } catch (e) {
          /* empty */
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      addErrorLog("Error in Survey Rating handleOnMessage", e);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onCancel={() => {
        setIsVisible(false);
        dispatch(showSurveyModal(false));
      }}
      style={styles.container}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL.SURVEY }}
        javaScriptEnabled
        injectedJavaScriptBeforeContentLoaded={webviewRunBeforeFirstScript}
        onLoadEnd={onLoadEnd}
        style={styles.webView}
        renderLoading={() => <FullPageLoading show />}
        startInLoadingState
        onMessage={handleOnMessage}
      />
    </Modal>
  );
};
export default memo(SurveyRating);

const styles = StyleSheet.create({
  container: {
    height: "60%",
    borderRadius: 10,
    overflow: "hidden",
  },
  webView: {
    minHeight: 200,
  },
});
