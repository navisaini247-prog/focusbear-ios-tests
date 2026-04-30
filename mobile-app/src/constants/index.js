export { NAVIGATION } from "@/constants/navigation";
export { STATUS } from "@/constants/status";
export { PLATFORMS } from "@/constants/platforms";
export { ROUTINE_NAMES } from "@/constants/routines";
export { FOCUSBEAR_APP_HOME_URL_SCHEME } from "@/constants/AppURLScheme";
export { FLAGS } from "@/constants/flags";
export { EDIT_HABITS_POST_MESSAGE } from "@/constants/events";
export { BEARSONAS } from "@/constants/bearsonas";
export { RECOMMENDED_BLOCKED_APPS, FILTER_CHIPS } from "@/constants/appsBlocklist";
export { STATS_TABS } from "@/constants/stats";
export { HOME_TABS } from "@/constants/home";

export const WEBVIEW_READY_TIMEOUT_MS = 15000; // 15 seconds

export const webviewRunBeforeFirstScript = `
window.isNativeApp = true;
true; // note: this is required, or you'll sometimes get silent failures
`;

export const MAX_RESTART_AFTER_SAVE_COUNT = 5;

export const HTTP_STATUS_CONFLICT = 409;

export const webviewBlockIOSReturnKeyJS = `
document.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    return false;
  }
});
`;

export const EMAIL_VERIFICATION_COOL_DOWN = {
  START: 0,
  RESET: 60,
};

export const TIME_UNIT_CONVERT_FACTOR = {
  ONE_MINUTE_AS_SECONDS: 60,
  ONE_HOUR_AS_SECONDS: 3600,
  ONE_SECOND_AS_MILLISECONDS: 1000,
};

export const FOCUS_BEAR_SPOON_URL =
  "https://www.focusbear.io/blog-post/spoon-theory-navigating-life-with-limited-energy";
