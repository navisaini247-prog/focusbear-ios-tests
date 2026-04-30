import { NativeModules } from "react-native";
import notifee from "@notifee/react-native";
import CalendarHelper from "@/utils/CalendarHelper";
import { store } from "@/store";
import { APIMethod } from "@/utils/ApiMethod";
import { NOTIFICATION_ID, NOTIFICATION_PRESS_ID } from "@/utils/Enums";
import COLOR from "@/constants/color";
import { i18n } from "@/localization";
import { createTriggerNotification } from "@/screens/Notification";
import {
  lateNoMoreNotificationsEnabledSelector,
  lateNoMoreReminderTimesSelector,
  lateNoMoreDismissedEventsSelector,
  lateNoMoreRequireMeetingUrlSelector,
} from "@/selectors/UserSelectors";
import { setLateNoMoreConnectedPlatforms, setLateNoMoreEvents } from "@/actions/UserActions";
import { addErrorLog, addInfoLog, logAPIError } from "@/utils/FileLogger";
import { APIURLS } from "@/utils/ApiUrls";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import moment from "moment";
const { LateNoMoreModule } = NativeModules;

const MEETING_DOMAINS = [
  "meet.google.com",
  "zoom.us",
  "teams.microsoft.com",
  "webex.com",
  "gotomeeting.com",
  "bluejeans.com",
  "whereby.com",
  "jitsi.meet",
];

const URL_REGEX = /(https?:\/\/[^\s]+)/;
export const REMINDER_TIMING_OPTIONS = [0, 2, 5, 10, 15, 30, 60, 120];
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const MEETING_VISIBILITY_GRACE_PERIOD = 20 * ONE_MINUTE;

let scheduledNotifications = [];

/**
 * LateNoMoreManager - This feature provides intelligent meeting reminders with the following capabilities:
 * - Calendar integration (backend API + local device calendar)
 * - User-configurable settings (reminders, meeting detection)
 */
class LateNoMoreManager {
  /**
   * Find the next eligible meeting (earliest start among all synced events that pass filters).
   * Must consider every event — if only `events[0]` was used, ignoring the first meeting hid all later ones.
   */
  getUpcomingMeeting(events, dismissedEvents, requireMeetingUrl) {
    if (!events?.length) return null;

    try {
      const now = Date.now();
      const dismissed = dismissedEvents || [];
      const isDismissed = (eventId) => dismissed.some((d) => String(d) === String(eventId));

      const filteredEvents = events.filter((event) => {
        const startTime = new Date(event.startDate).getTime();
        const latestVisibleTime = startTime + MEETING_VISIBILITY_GRACE_PERIOD;

        const isUpcoming = startTime - now <= 2 * ONE_HOUR && now <= latestVisibleTime;

        const hasMeetingUrl = Boolean(this.extractMeetingUrl(event));

        return isUpcoming && !isDismissed(event.id) && (!requireMeetingUrl || hasMeetingUrl);
      });

      filteredEvents.sort((a, b) => {
        const timeA = new Date(a.startDate).getTime();
        const timeB = new Date(b.startDate).getTime();

        if (timeA !== timeB) {
          return timeA - timeB;
        }
        // If 2 events start at the same time, choose the one with the most details
        const detailScoreA = this.calculateEventDetailScore(a);
        const detailScoreB = this.calculateEventDetailScore(b);

        return detailScoreB - detailScoreA;
      });

      return filteredEvents[0] ?? null;
    } catch (error) {
      addErrorLog("Failed to get upcoming meetings:", error);
      return null;
    }
  }

  /**
   * Calculate a score for event detail richness (higher = more details)
   */
  calculateEventDetailScore(event) {
    let score = 0;

    const url = this.extractMeetingUrl(event);
    if (url) score += 2;
    if (event.source === "local") score += 2; // value local events because they can be opened in the users calendar app
    if (event.description) score += 2;
    if (event.location) score += 1;
    if (event.attendees && event.attendees.length > 0) score += 1;
    if (event.endDate) score += 1;
    return score;
  }

  /**
   * Stop all calendar checking and background services
   */
  stopMeetingChecks() {
    if (checkIsAndroid()) {
      try {
        addInfoLog("[LNM Manager] Telling native module to stop service.");
        LateNoMoreModule.stopService();
      } catch (error) {
        addErrorLog("Error stopping Android background service:", error);
      }
    }
  }

  /**
   * Starts Android background service for keep-alive
   */
  async setupMeetingChecks() {
    if (checkIsAndroid()) {
      try {
        addInfoLog("[LNM Manager] Starting Android background service");
        LateNoMoreModule.startService();
      } catch (error) {
        addErrorLog("Error starting Android background service:", error);
      }
    }
  }

  /**
   * Fetch calendar events from backend API
   * @param {string} platform - Calendar platform (default: "google")
   * @returns {Promise<Array>} Array of calendar events
   */
  async fetchBackendCalendarEvents(platform = "google") {
    try {
      const { data: calendarData } = await APIMethod({
        endpoint: APIURLS.calendarData(platform),
        method: "GET",
      });

      const account = calendarData?.calendars?.[0]?.account;
      const isCalendarExpired = Boolean(calendarData?.calendars?.some((calendar) => calendar?.expired === true));

      if (isCalendarExpired) {
        addInfoLog(
          `[LNM Manager] ${platform} calendar access has expired. Re-authorization is required before fetching events.`,
        );
        store.dispatch(setLateNoMoreConnectedPlatforms({ google: false }));
        return [];
      }

      if (account) {
        addInfoLog(`[LNM Manager] Connected to ${platform} calendar, account: ${account}`);
        store.dispatch(setLateNoMoreConnectedPlatforms({ google: true }));
      } else {
        addInfoLog(`[LNM Manager] No account found in ${platform} calendar`, calendarData);
        store.dispatch(setLateNoMoreConnectedPlatforms({ google: false }));
        return [];
      }

      const { data: events } = await APIMethod({
        endpoint: APIURLS.calendarEvents(platform),
        method: "GET",
        params: { account },
      });

      if (!Array.isArray(events)) {
        addInfoLog(`[LNM Manager] Unexpected response format:`, events);
        return [];
      }

      // Filter out all-day events and those without a start date
      const filteredEvents = events.filter((event) => Boolean(event) && !event.all_day && event.event_begins);

      const normalisedEvents = filteredEvents.map((event) => ({
        ...event,
        id: event.external_id || event.external_metadata.id,
        title: event.summary,
        startDate: event.event_begins,
        endDate: event.event_ends,
        allDay: event.all_day,
        source: platform,
      }));

      addInfoLog(`[LNM Manager] Backend returned ${events.length} total and ${normalisedEvents.length} valid events`);
      return normalisedEvents;
    } catch (error) {
      logAPIError("[LNM Manager] Error fetching backend calendar events:", error);
      return [];
    }
  }

  /**
   * Check for upcoming meetings and schedule notifications
   */
  async checkUpcomingMeetings() {
    addInfoLog("[LNM Manager] Running checkUpcomingMeetings...");
    const state = store.getState();
    const notificationsEnabled = lateNoMoreNotificationsEnabledSelector(state);
    const requireMeetingUrl = lateNoMoreRequireMeetingUrlSelector(state);
    const dismissedEvents = lateNoMoreDismissedEventsSelector(state) || [];

    const hasPermissions = await CalendarHelper.checkPermissions();

    addInfoLog(`[LNM Manager] calendarPermissions: ${hasPermissions}, notificationsEnabled: ${notificationsEnabled},`);

    const backendEvents = await this.fetchBackendCalendarEvents("google");
    const localEvents = hasPermissions ? await CalendarHelper.getUpcomingEvents() : [];

    const allEvents = [].concat(backendEvents, localEvents);

    store.dispatch(setLateNoMoreEvents(allEvents));

    if (allEvents.length === 0) return;

    if (dismissedEvents.length > 0) addInfoLog(`[LNM Manager] ${dismissedEvents.length} dismissed events`);

    const upcoming = this.getUpcomingMeeting(allEvents, dismissedEvents, requireMeetingUrl);

    if (!upcoming) {
      addInfoLog(`[LNM Manager] No meetings within 1hr found.`);
      this.cancelScheduledNotifications();
      return;
    }

    if (notificationsEnabled) {
      this.scheduleMeetingNotifications(upcoming);
    } else {
      this.cancelScheduledNotifications();
    }
  }

  /**
   * Extract meeting URL from calendar event data
   * @param {Object} event - Calendar event object
   * @returns {string} Meeting URL or empty string
   */
  extractMeetingUrl(event) {
    if (!event) return "";

    // Fields to check for URLs
    const urlFields = [event?.external_metadata?.hangoutLink, event?.url, event?.meetingUrl];
    const otherFields = [event?.notes, event?.description, event?.location];
    const entryPointsArrays = [
      event?.external_metadata?.conferenceData?.entryPoints,
      event?.conferenceData?.entryPoints,
    ];

    // Check dedicated URL fields
    for (const urlField of urlFields) {
      if (urlField && typeof urlField === "string" && URL_REGEX.test(urlField)) {
        return urlField;
      }
    }

    // Check general fields for meeting URLs
    for (const field of otherFields) {
      if (field && typeof field === "string") {
        const urls = field.match(/https?:\/\/[^\s]+/g);
        if (urls && urls.length > 0) {
          const meetingUrls = urls.filter((url) => MEETING_DOMAINS.some((domain) => url.includes(domain)));
          if (meetingUrls.length > 0) {
            return meetingUrls[0];
          }
        }
      }
    }

    // Check conference data
    for (const entryPoints of entryPointsArrays) {
      if (Array.isArray(entryPoints)) {
        for (const entryPoint of entryPoints) {
          if (entryPoint?.uri && typeof entryPoint.uri === "string") {
            return entryPoint.uri;
          }
        }
      }
    }

    return "";
  }

  async scheduleMeetingNotifications(meeting) {
    // Cancel old notifications
    await this.cancelScheduledNotifications();

    const reminderTimes = lateNoMoreReminderTimesSelector(store.getState()) || [2, 15];
    const meetingTime = new Date(meeting?.startDate);

    addInfoLog(`[LNM Manager] Scheduling notifications at ${reminderTimes.join(", ")} minutes before meeting`);

    for (const reminder of reminderTimes) {
      const timestamp = meetingTime.getTime() - reminder * ONE_MINUTE; // schedule for x minutes before meeting

      // Only schedule if the notification time is in the future
      if (timestamp > Date.now()) {
        try {
          const id = `${NOTIFICATION_ID.LATE_NO_MORE}_${reminder}`;
          await createTriggerNotification({
            id,
            timestamp,
            title: i18n.t(`lateNoMore.notification${(reminder % 2) + 1}`),
            body: i18n.t(`lateNoMore.notificationBody`, {
              title: meeting?.title,
              time: reminder === 0 ? i18n.t("lateNoMore.now") : moment.duration(reminder, "minutes").humanize(true),
            }),
            deeplink: "late-no-more",
            data: {
              eventId: String(meeting?.id),
            },
            android: {
              color: COLOR.AMBER[500],
              actions: [
                {
                  title: i18n.t("lateNoMore.ignoreMeeting"),
                  pressAction: { id: NOTIFICATION_PRESS_ID.DISMISS_EVENT },
                },
              ],
            },
            ios: {
              categoryId: NOTIFICATION_ID.LATE_NO_MORE,
            },
          });

          scheduledNotifications.push({ id, timestamp });
        } catch (error) {
          addErrorLog(`[LNM Manager] Failed to schedule notification:`, error);
        }
      } else {
        addInfoLog(`[LNM Manager] Skipping notification at ${new Date(timestamp).toLocaleTimeString()} - time passed`);
      }
    }
  }

  async cancelScheduledNotifications(cancelAll = false) {
    if (scheduledNotifications.length > 0) {
      addInfoLog("[LNM Manager] Cancelling previously scheduled notifications...");
      while (scheduledNotifications.length > 0) {
        const { id, timestamp } = scheduledNotifications.pop();
        // Only cancel notifications that have yet to be sent, unless cancelAll is true
        if (timestamp > Date.now() || cancelAll) {
          try {
            await notifee.cancelNotification(id);
          } catch (error) {
            addErrorLog(`[LNM Manager] Failed to cancel trigger notification ${id}:`, error);
          }
        }
      }
    } else {
      addInfoLog("[LNM Manager] No previously scheduled notifications");
    }
  }
}

const manager = new LateNoMoreManager();
export default manager;
