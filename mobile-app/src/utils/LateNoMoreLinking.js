import { Linking } from "react-native";
import { addErrorLog } from "@/utils/FileLogger";

export const formatMeetingUrlForDisplay = (url) => {
  try {
    const { host, pathname } = new URL(url);
    return `${host}${pathname}`;
  } catch (error) {
    return url;
  }
};

/**
 * Opens a meeting URL, preferring native Google Meet deep links when applicable.
 * @param {string} [url]
 * @param {() => void | Promise<void>} [onFallback] — e.g. open calendar event
 */
export async function openLateNoMoreMeetingUrl(url, onFallback) {
  if (!url) {
    await onFallback?.();
    return;
  }

  const normalizedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

  try {
    if (normalizedUrl.includes("meet.google.com")) {
      const { pathname } = new URL(normalizedUrl);
      const meetingCode = pathname.replace(/^\//, "");
      const googleMeetDeepLinks = [`googlemeet://meet/${meetingCode}`, `comgooglemeet://meet/${meetingCode}`];

      for (const deepLink of googleMeetDeepLinks) {
        if (await Linking.canOpenURL(deepLink)) {
          await Linking.openURL(deepLink);
          return;
        }
      }
    }

    await Linking.openURL(normalizedUrl);
  } catch (error) {
    addErrorLog("[LateNoMore] Failed to open meeting URL:", error);
    await onFallback?.();
  }
}

/**
 * Opens the meeting link only when within the join window or the meeting is treated as ongoing; otherwise opens calendar.
 */
export async function openLateNoMoreMeetingUrlWithJoinGuard(
  url,
  { isWithinJoinWindow, isMeetingOngoing, onOpenCalendar },
) {
  if (!url) {
    await onOpenCalendar?.();
    return;
  }
  if (!isWithinJoinWindow && !isMeetingOngoing) {
    await onOpenCalendar?.();
    return;
  }
  await openLateNoMoreMeetingUrl(url, onOpenCalendar);
}
