import axios from "axios";
import axiosRetry, { isRetryableError } from "axios-retry";
import { Config } from "react-native-config";
import { i18n } from "@/localization";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";

// Helper functions for error tracking
const isTimeoutError = (error) => {
  return error.code === "ECONNABORTED" || (error.message && error.message.toLowerCase().includes("timeout"));
};

// Pure network error — request was sent but no response received (e.g. Android "Network Error")
const isNetworkError = (error) => !error.response && Boolean(error.request);

const getEndpointUrl = (config) => {
  const baseURL = config?.baseURL || "";
  const url = config?.url || "";
  const cleanUrl = url.startsWith("/") && baseURL.endsWith("/") ? url.slice(1) : url;
  return `${baseURL}${cleanUrl}`;
};

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

const client = axios.create({
  baseURL: Config.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add retry logic mirroring CustomMethod.js — retries on 5xx and pure network errors (#4162)
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (error?.response?.status >= 500 && isRetryableError(error)) return true;
    if (isNetworkError(error)) return true;
    return false;
  },
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Track backend errors and timeouts
    trackBackendError(error, error.config);

    if (error.response) {
      return Promise.reject(error.response.data);
    } else if (error.request) {
      return Promise.reject({ error: i18n.t("networkError.connectionError") });
    } else {
      return Promise.reject(error);
    }
  },
);

const setAuthorization = (token) => {
  client.defaults.headers.common.authorization = token;
};

const clearAuthorization = () => {
  delete client.defaults.headers.common.authorization;
};

export const HttpClient = { ...client, setAuthorization, clearAuthorization };
