import PostHog from "posthog-react-native";
import DeviceInfo from "react-native-device-info";
import { REGEX } from "@/utils/Enums";
import * as Sentry from "@sentry/react-native";
import { checkIsAndroid } from "./PlatformMethods";
import { logUserEvents } from "@/actions/ActivityActions";
import { addErrorLog, addInfoLog } from "./FileLogger";
import { calculateDayOfUsage } from "./TimeMethods";
import { store } from "@/store";
import { POSTHOG_PERSON_PROPERTIES } from "./Enums";
import { checkIsDev } from "./GlobalMethods";

export const POSTHOG_KEY = "phc_Y6hD2dvO1zylm7CLij5CuNt6S5gTxe7EVXoxZcb2xUm";

export const posthog = new PostHog(POSTHOG_KEY, {
  // PostHog API host
  host: "https://app.posthog.com",
  // The number of events to queue before sending to PostHog (flushing)
  flushAt: 1,
  // How many times we will retry HTTP requests
  fetchRetryCount: 3,
  // The delay between HTTP request retries
  fetchRetryDelay: 3000,
  // For Session Analysis how long before we expire a session
  sessionExpirationTimeSeconds: 1800, // 30 mins
  // Whether to post events to PostHog in JSON or compressed format
  enableSessionReplay: !checkIsDev(),
  // captureMode?: 'json' | 'form'
  sessionReplayConfig: {
    maskAllTextInputs: false,
    maskAllImages: false,
    captureLog: true,
  },
});

export const postHogCapture = (eventName, properties = {}) => {
  addInfoLog(`Posthog Capture eventdata body ==> ${eventName}`, properties);
  const user = store.getState()?.user;

  const dayOfUsage = user?.created_at ? calculateDayOfUsage(user?.created_at) : 0;

  const defaultProperty = {
    appVersion: `v${DeviceInfo.getVersion()}`,
    [POSTHOG_PERSON_PROPERTIES.DAY_OF_USAGE]: dayOfUsage,
  };

  // Check if user is internal tester based on their email
  const isTester = user?.email && REGEX.INTERNAL_TESTER_EMAIL.test(user.email);

  if (isTester) {
    return;
  }

  posthog.capture(eventName, { ...defaultProperty, ...properties });
  logUserEvents(eventName, { ...defaultProperty, ...properties });
};

//call when logging out
export const postHogUnlink = () => {
  posthog.reset();
};

//updates Person Properties
export const posthogSetProperties = (userId, properties) => {
  posthog.identify(userId, properties);
};

//links posthog tracking data to this user, call on signup/in, and on update Person Properties
export const postHogIdentify = (userId, isPayingUser) => {
  try {
    const userCreds = {
      isPayingUser: isPayingUser,
    };
    if (checkIsAndroid()) {
      userCreds.isAndroidUser = true;
    } else {
      userCreds.isIosUser = true;
    }

    posthog.identify(userId, userCreds);
  } catch (e) {
    addErrorLog("error assigning user to posthog: ", e);
  }
};

export const logSentryError = (message, extraDetails = undefined) => {
  if (message) {
    Sentry.captureException(message, extraDetails);
  }
};
