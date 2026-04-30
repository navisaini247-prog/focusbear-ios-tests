import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import i18n from "@/localization/i18n";

export const showRequestRetryMessage = (retryCount, error) => {
  Toast.show({
    type: "warn",
    text1: getErrorMessage(error).title,
    text2: `${i18n.t("networkError.retrying")}${".".repeat(retryCount)}`,
  });
};

export const showRequestErrorMessage = (error, showAlert) => {
  const { title, message, longMessage } = getErrorMessage(error);
  if (showAlert) {
    Alert.alert(title, longMessage, [{ text: i18n.t("common.ok") }]);
  } else {
    Toast.show({ type: "error", text1: title, text2: message, position: "bottom" });
  }
};

// Designed to handle errors from axios requests
const getErrorMessage = (error) => {
  // Has response -> API error
  // No response -> Network error
  // No response or request -> An exception was thrown (shouldn't happen)

  if (error?.response) {
    return {
      title: `${i18n.t("networkError.apiError")} (${error?.response?.status})`,
      message: i18n.t("networkError.apiErrorMessage"),
      longMessage: i18n.t("networkError.apiErrorLongMessage"),
    };
  } else if (error?.request) {
    // For network connection issues, prioritize the localized message
    // Check if this is a network-related error and use appropriate localized message
    const isNetworkError = !error.response && error.request;

    // Check if the error message contains "Network Error" and replace it
    const errorMessage = error?.message || "";
    const isNetworkErrorString = errorMessage.toLowerCase().includes("network error");

    if (isNetworkError || isNetworkErrorString) {
      return {
        title: i18n.t("networkError.connectionError"),
        message: i18n.t("networkError.connectionErrorMessage"),
        longMessage: i18n.t("networkError.connectionErrorLongMessage"),
      };
    }

    // Fallback to using error.message for other request errors
    return {
      title: error?.message || i18n.t("networkError.connectionError"),
      message: i18n.t("networkError.connectionErrorMessage"),
      longMessage: i18n.t("networkError.connectionErrorLongMessage"),
    };
  } else {
    return {
      title: `${i18n.t("networkError.internalError")} (${error?.message || error})`,
      message: i18n.t("networkError.internalErrorMessage"),
      longMessage: i18n.t("networkError.internalErrorLongMessage"),
    };
  }
};
