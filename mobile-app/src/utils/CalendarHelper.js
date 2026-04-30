// eslint-disable-next-line react-native/split-platform-components
import { Platform, PermissionsAndroid } from "react-native";
import RNCalendarEvents from "react-native-calendar-events";
import { addErrorLog, addInfoLog } from "./FileLogger";

/**
 * CalendarHelper - Calendar integration utilities for the "Late No More" feature
 *
 * This module provides cross-platform calendar functionality:
 * - Permission checking and requesting
 * - Fetching upcoming calendar events
 * - Filtering events (removing all-day events, events without titles)
 * - Platform-specific implementations (Android vs iOS)
 *
 */

class CalendarHelper {
  /**
   * Check if calendar permissions are granted
   * @returns {Promise<boolean>} Permission status
   */
  static async checkPermissions() {
    try {
      if (Platform.OS === "android") {
        const status = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CALENDAR);
        return status;
      }
      const status = await RNCalendarEvents.checkPermissions();
      return status === "authorized";
    } catch (error) {
      addErrorLog("Calendar permission check error:", error);
      return false;
    }
  }

  /**
   * Request calendar permissions from the user
   * @returns {Promise<boolean>} Permission grant status
   */
  static async requestPermissions() {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CALENDAR);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      const status = await RNCalendarEvents.requestPermissions();
      return status === "authorized";
    } catch (error) {
      addErrorLog("Calendar permission request error:", error);
      return false;
    }
  }

  /**
   * Fetch upcoming calendar events from local device calendars
   *
   * This function:
   * 1. Fetches events within the specified time window
   * 2. Filters out invalid events (all-day, no title, no start time)
   *
   * @param {number} minutesToCheck - Minutes ahead to check for events (default: 60)
   * @returns {Promise<Array>} Array of valid calendar events
   */
  static async getUpcomingEvents(minutesToCheck = 120) {
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + minutesToCheck * 60000);

      const events = await RNCalendarEvents.fetchAllEvents(now.toISOString(), endDate.toISOString());

      // Filter out events that are not suitable for meeting reminders
      const filteredEvents = events.filter((event) => event.startDate && !event.allDay);

      addInfoLog(`[CalendarHelper] Found ${events.length} total and ${filteredEvents.length} valid events.`);

      return filteredEvents.map((event) => ({ ...event, source: "local" }));
    } catch (error) {
      addErrorLog("[CalendarHelper] Error fetching upcoming events:", error);
      return [];
    }
  }
}

export default CalendarHelper;
