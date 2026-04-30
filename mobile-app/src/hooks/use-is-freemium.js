import { useSelector } from "react-redux";
import { Alert } from "react-native";
import { NAVIGATION } from "@/constants";
import { i18n } from "@/localization";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { store } from "@/store";

export const FREEMIUM_ACTIVITY_LIMIT = 3;
export const FREEMIUM_APP_LIMIT = 5;
export const FREEMIUM_BLOCK_URL_LIMIT = 3;
export const FREEMIUM_FOCUS_LIMIT = 25 * 60 * 1000;

const detectTestEmail = (email) => /^internaltest\+freemiumtest_\d+@focusbear\.io$/.test(email);

// Choose the hook if you *need reactivity*, otherwise use checkIsFreemium
export const useIsFreemium = () => {
  const hasActiveSubscription = useSelector((state) => state.user?.userSubscriptionDetails?.hasActiveSubscription);
  const userEmail = useSelector((state) => state.user?.email);
  return !hasActiveSubscription || detectTestEmail(userEmail);
};

export const checkIsFreemium = () => {
  const state = store.getState();
  const hasActiveSubscription = state.user?.userSubscriptionDetails?.hasActiveSubscription;
  const userEmail = state.user?.email;
  return !hasActiveSubscription || detectTestEmail(userEmail);
};

export const useIsActivityLocked = () => {
  const isFreemium = useIsFreemium();

  const checkIsActivityLocked = (index) => {
    return isFreemium && index >= FREEMIUM_ACTIVITY_LIMIT;
  };

  return checkIsActivityLocked;
};

export const checkIsAppLimitExceeded = (selectedCount) => {
  return checkIsFreemium() && selectedCount > FREEMIUM_APP_LIMIT;
};

export const checkIsBlockUrlLimitExceeded = (urlCount) => {
  return checkIsFreemium() && urlCount > FREEMIUM_BLOCK_URL_LIMIT;
};

export const checkIsFocusLimitExceeded = (focusTime) => {
  return checkIsFreemium() && focusTime.getTime() > FREEMIUM_FOCUS_LIMIT;
};

export const checkIsActivityLocked = (index) => {
  return checkIsFreemium() && index >= FREEMIUM_ACTIVITY_LIMIT;
};

export const showFreemiumAlert = (title, subTitle, navigation) => {
  // prettier-ignore
  Alert.alert(title, subTitle, [
    {
      text: i18n.t("common.no_thanks"),
      style: "cancel",
      onPress: () => postHogCapture(POSTHOG_EVENT_NAMES.USER_CANCEL_FREEMIUM_ALERT),
    },
    {
      text: i18n.t("subscription.upgrade"),
      onPress: () => {
        postHogCapture(POSTHOG_EVENT_NAMES.USER_ACCEPT_FREEMIUM_ALERT);
        navigation && navigation.navigate(NAVIGATION.Subscription);
      },
    },
  ],
  { cancelable: true });
};
