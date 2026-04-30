import { Alert, Platform } from "react-native";
import axios from "axios";
import axiosRetry, { isRetryableError } from "axios-retry";
import deviceInfoModule from "react-native-device-info";
import { AUTH0, POSTHOG_EVENT_NAMES } from "./Enums";
import { addErrorLog, addInfoLog, logAPIError } from "./FileLogger";
import { logout, updateAuthToken } from "@/actions/UserActions";
import { store } from "@/store";
import { i18n } from "@/localization";
import { showRequestRetryMessage, showRequestErrorMessage } from "./ErrorMessages";
import { postHogCapture } from "./Posthog";

const REQUEST_TIMEOUT = 15000;
const REQUEST_RETRY_TIMES = 5;
const REQUEST_RETRY_METHODS = ["get", "post", "put", "delete", "patch"];

// Helper function to detect if an error is a timeout
const isTimeoutError = (error) => {
  return error.code === "ECONNABORTED" || (error.message && error.message.toLowerCase().includes("timeout"));
};

// Helper function to detect pure network errors (no response received — e.g. Android "Network Error")
const isNetworkError = (error) => !error.response && Boolean(error.request);

// Helper function to get the full endpoint URL for tracking
const getEndpointUrl = (config) => {
  const baseURL = config?.baseURL || "";
  const url = config?.url || "";
  // Remove leading slash from url if baseURL already ends with slash
  const cleanUrl = url.startsWith("/") && baseURL.endsWith("/") ? url.slice(1) : url;
  return `${baseURL}${cleanUrl}`;
};

// Track backend errors and timeouts with PostHog
const trackBackendError = (error, config) => {
  const endpointUrl = getEndpointUrl(config);

  if (isTimeoutError(error)) {
    postHogCapture(POSTHOG_EVENT_NAMES.BACKEND_TIMED_OUT, {
      endpoint_url: endpointUrl,
    });
  } else if (isNetworkError(error)) {
    postHogCapture(POSTHOG_EVENT_NAMES.NETWORK_ERROR, {
      endpoint_url: endpointUrl,
      error_code: error?.code,
      platform: "android",
    });
  } else if (error?.response?.status) {
    const eventData = {
      status_code: error.response.status.toString(),
      endpoint_url: endpointUrl,
    };

    // Add response data if available
    if (error.response.data) {
      eventData.response_data = error?.message || error?.response?.data;
    }

    postHogCapture(POSTHOG_EVENT_NAMES.BACKEND_ERRORED_OUT, eventData);
  }
};

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
  Accept: "application/json",
  platform: `${Platform.OS}-react-native`,
  "platform-version": `${deviceInfoModule.getSystemVersion()}`,
  "app-version": `${deviceInfoModule.getVersion()}`,
};

export const customRequest = axios.create({
  timeout: REQUEST_TIMEOUT,
  headers,
  transformRequest: (data) => JSON.stringify(data),

  // Custom config
  enableRetry: true, // Enable retrying some failed requests
  enableErrorMessage: true, // Display an error message (toast). Disable for custom error handling
  enableErrorAlert: false, // Display an alert for errors. Enable for critical user-initiated requests
  noToken: false, // Don't send access token in the request
});

const retryCondition = (error) => {
  const method = error.config?.method || "";
  const enableRetry = error.config?.enableRetry;
  const isMethodRetryable = REQUEST_RETRY_METHODS.includes(method);

  if (!enableRetry || !isMethodRetryable) return false;

  // Retry on server errors (5xx). Doesn't retry aborted requests.
  if (error?.response?.status >= 500 && isRetryableError(error)) return true;

  // Retry on pure network errors (no response received — e.g. Android "Network Error").
  // This is the primary fix for #4162: `undefined >= 500` evaluates to false, so network
  // errors were never retried. We now explicitly handle the !response && request case.
  if (isNetworkError(error)) return true;

  return false;
};

axiosRetry(customRequest, {
  retries: REQUEST_RETRY_TIMES,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition,
  onRetry: (retryCount, error) => {
    addInfoLog(`Retrying request (x${retryCount}) for /${error.config?.url}`);
    showRequestRetryMessage(retryCount, error);
  },
  onMaxRetryTimesExceeded: (error) => {
    addErrorLog(`Max retry times exceeded for /${error.config?.url}`);
    // Track the final error after max retries exceeded
    trackBackendError(error, error.config);
    const shouldShowErrorMessage = error.config?.enableErrorMessage;
    const shouldShowAlert = error.config?.enableErrorAlert;
    shouldShowErrorMessage && showRequestErrorMessage(error, shouldShowAlert);
  },
});

customRequest.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response = {}, config } = error;
    const method = config?.method || "";

    const didRetry = retryCondition(error);
    addErrorLog(`Error sending ${method.toUpperCase()} request to /${config?.url}${!didRetry ? " (no retry)" : ""}`);

    trackBackendError(error, config);

    // Showing error messages to the user is handled here when the request is not retried
    const shouldShowErrorMessage = !didRetry && config?.enableErrorMessage;
    const shouldShowAlert = config?.enableErrorAlert;
    shouldShowErrorMessage && showRequestErrorMessage(error, shouldShowAlert);

    //checking if error is Aunothorized error
    if (response?.status === 401) {
      addErrorLog("<<<=======  login has been expired  ======>");
      const state = store.getState();

      const accessToken = state?.user?.accessToken;
      const refreshToken = state?.user?.refreshToken;

      if (refreshToken) {
        try {
          const refreshTokenResponse = await getRefreshToken(accessToken, refreshToken);

          if (refreshTokenResponse?.accessToken) {
            store.dispatch(updateAuthToken(refreshTokenResponse));
            config.headers.Authorization = "Bearer " + refreshTokenResponse.accessToken;
            return customRequest(config);
          }
        } catch (err) {
          if (err?.status <= 500) {
            store.dispatch(logout());
            await Alert.alert(i18n.t("common.session_expired"), i18n.t("common.login_again"), [
              { text: i18n.t("common.ok") },
            ]);
          }
        }
      }

      if (accessToken) {
        addErrorLog("no refresh token found: logout");
        store.dispatch(logout());
        await Alert.alert(i18n.t("common.session_expired"), i18n.t("common.login_again"), [
          { text: i18n.t("common.ok") },
        ]);
      }
    }

    return Promise.reject(error);
  },
);

const getRefreshToken = async (accessToken, refreshToken) => {
  // set header for axios refresh
  customRequest.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  return new Promise((resolve, reject) => {
    AUTH0.auth
      .refreshToken({ refreshToken: refreshToken })
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        logAPIError("refreshToken error", error);
        reject(error);
      });
  });
};
