import { i18n } from "@/localization";
import { store } from "@/store";
import moment from "moment";
import { ROUTINE_NAMES } from "@/constants";
import { DAYS, formatWeekdays } from "@/constants/activity";
import humanizeDuration from "humanize-duration";

const isBetweenDates = (startTime, endTime, time = new Date()) => {
  if (!startTime || !endTime) return false;
  const startMs = startTime.getTime();
  const endMs = endTime.getTime();
  const timeMs = time.getTime();

  // Calculates if `time` is between `startTime` and `endTime`
  return startMs < endMs
    ? // Normal range (e.g. 01:00 to 08:00)
      timeMs > startMs && timeMs < endMs
    : // Wraps around midnight (e.g. 22:00 to 08:00)
      timeMs > startMs || timeMs < endMs;
};

const convertSecToMins = (value = null, fullFormat = true) => {
  if (!value) {
    return fullFormat ? "00:00" : "00";
  }
  const minutes = String(Math.floor(value / 60)).padStart(2, "0");
  const seconds = String(value % 60).padStart(2, "0");
  if (!fullFormat && !seconds) {
    return minutes;
  }
  return `${minutes}:${seconds}`;
};

const getTimeDifference = (startDate, endDate, diffType = "minutes") => {
  const firstDate = moment(startDate);
  const secondDate = moment(endDate);
  return secondDate.diff(firstDate, diffType);
};

const isBeforeMethod = (startDate, endDate) => moment(startDate).isBefore(endDate);

/**
 * Parses "hh:mm" time strings into hours and minutes
 * @param {string} time string
 * @returns {{ hours: number, min: number }} object with hours and minutes
 */
const getSplitTime = (time = "") => {
  const [hours, min] = time.split(":").map(Number);
  return { hours: hours || 0, min: min || 0 };
};

/**
 * Same as `getSplitTime` but returns a date object
 * @param {string} time string
 * @returns {Date} date object
 */
const getSplitDateTime = (time) => {
  const { hours, min } = getSplitTime(time);
  return new Date(new Date().setHours(hours, min, 0, 0));
};

const getMorningEveningDateTime = () => {
  const { startup_time, shutdown_time } = store.getState().routine.fullRoutineData;
  return { startUpDateTime: getSplitDateTime(startup_time), shutDownDateTime: getSplitDateTime(shutdown_time) };
};

const getRoutineStartEndTime = (startRoutineFor) => {
  const isMorning = startRoutineFor === ROUTINE_NAMES.MORNING;
  const { startUpDateTime, shutDownDateTime } = getMorningEveningDateTime();

  const nextTime = isMorning ? startUpDateTime : shutDownDateTime;

  const day = startRoutineFor === ROUTINE_NAMES.MORNING ? i18n.t("common.tomorrow") : i18n.t("common.today");

  return moment(nextTime).calendar({ sameDay: i18n.t("common.next_time_format", { day }) });
};

function convertTo12HourFormat(time24) {
  if (!time24 || !time24?.includes(":")) {
    return "";
  }

  let [hours, minutes] = time24.split(":");
  let period = hours >= 12 ? "pm" : "am";

  if (hours > 12) {
    hours -= 12;
  } else if (hours === "00") {
    hours = 12;
  }

  return `${hours}:${minutes} ${period}`;
}

const compareTime = (futureTime, currentTime) => {
  if (futureTime - currentTime <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  const timeDifference = Math.abs(futureTime - currentTime);

  // Calculate the hours and minutes from the time difference
  const hours = Math.floor(timeDifference / 3600000);
  const minutes = Math.floor((timeDifference % 3600000) / 60000);
  const seconds = Math.floor((timeDifference % 60000) / 1000);

  return { hours, minutes, seconds };
};

const calculateNextClearTimestamp = (routineData) => {
  const startTime = routineData?.startup_time;
  if (!startTime) {
    return null;
  } // No startup time, cannot calculate next clear timestamp
  const { hours, min } = getSplitTime(startTime);

  const nowHour = new Date().getHours();
  const nowMin = new Date().getMinutes();

  const shouldClearToday = nowHour < hours || (nowHour === hours && nowMin <= min);

  const expectedTimestamp = new Date().setHours(shouldClearToday ? hours : hours + 24, min, 0, 0);

  return expectedTimestamp / 1000;
};

const isDateBeforeTodaysRoutineBegan = (date = new Date(), startupTime) => {
  if (!startupTime) return false;
  return date.getTime() < getSplitDateTime(startupTime).getTime();
};

function formatDuration(hours, minutes, seconds) {
  const hoursString = hours ? i18n.t("focusMode.duration.hours", { hours }) : "";
  const minutesString = minutes ? i18n.t("focusMode.duration.minutes", { minutes }) : "";
  const secondsString = seconds ? i18n.t("focusMode.duration.seconds", { seconds }) : "";

  return i18n
    .t("focusMode.duration.format", {
      hours: hoursString,
      minutes: minutesString,
      seconds: secondsString,
    })
    .trim();
}

const isAfterCutOffTime = (cutoffTime, startUpTime) => {
  if (!cutoffTime || !startUpTime) {
    return false;
  }

  const cutoff = getSplitDateTime(cutoffTime);
  const startup = getSplitDateTime(startUpTime);

  // Return true if the current time is after cutoff time and before startup time
  return isBetweenDates(cutoff, startup);
};

const calculateDayOfUsage = (signupTime) => {
  const signupDate = moment(signupTime).startOf("day");
  const currentDate = moment().startOf("day");
  return currentDate.diff(signupDate, "days");
};

const formatTime = (milliseconds) => {
  if (!milliseconds) {
    return "N/A";
  }

  const time = new Date(milliseconds);
  const parts = { h: time.getUTCHours(), m: time.getUTCMinutes(), s: time.getUTCSeconds() };
  return Object.entries(parts)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${value}${key}`)
    .join(" ");
};

export const formatDate = (date) => {
  if (!date) {
    return "N/A";
  }

  const isSameYear = new Date().getFullYear() === new Date(date).getFullYear();
  return moment(date).format(isSameYear ? "Do MMM" : "Do MMM YYYY");
};

export const formatDateFromNow = (date) => {
  if (!date) {
    return "N/A";
  }

  date = new Date(date);
  const today = new Date();
  const tomorrow = new Date(new Date().setDate(today.getDate() + 1));
  const yesterday = new Date(new Date().setDate(today.getDate() - 1));

  if (date.toDateString() === today.toDateString()) {
    return i18n.t("common.today");
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return i18n.t("common.tomorrow");
  } else if (date.toDateString() === yesterday.toDateString()) {
    return i18n.t("common.yesterday");
  }
  return formatDate(date);
};

export const formatLateNoMoreMeetingTimeRange = (upcomingMeeting) => {
  if (!upcomingMeeting?.startDate || !upcomingMeeting?.endDate) return null;
  const start = new Date(upcomingMeeting.startDate);
  const end = new Date(upcomingMeeting.endDate);
  if (isNaN(start) || isNaN(end)) return null;

  const startTime = moment(start).format("LT").toLowerCase();
  const endTime = moment(end).format("LT").toLowerCase();
  return `${formatDateFromNow(start)} ${startTime} — ${endTime}`;
};

const formatHumanizeDuration = (milliseconds, options = {}) => {
  return humanizeDuration(milliseconds, {
    language: i18n.language,
    fallbacks: ["en"],
    round: true,
    ...options,
  });
};

const isCutoffLessThan2HoursBeforeStartup = (cutOffTime, startUpTime) => {
  if (!cutOffTime || !startUpTime) {
    return false;
  }

  const startUpDate = getSplitDateTime(startUpTime);
  const cutOffDate = getSplitDateTime(cutOffTime);
  const startUpDateMinus2Hours = new Date(startUpDate.getTime() - 2 * 60 * 60 * 1000);

  return isBetweenDates(startUpDateMinus2Hours, startUpDate, cutOffDate);
};

const isNowLessThan2HoursBeforeStartup = (startUpTime) => {
  if (!startUpTime) {
    return false;
  }

  const startUpDate = getSplitDateTime(startUpTime);
  const startUpDateMinus2Hours = new Date(startUpDate.getTime() - 2 * 60 * 60 * 1000);

  return isBetweenDates(startUpDateMinus2Hours, startUpDate);
};

const isCutoffBeforeStartup = (startUpTime, cutOffTime) => {
  if (!startUpTime || !cutOffTime) {
    return false;
  }

  const startupMs = getSplitDateTime(startUpTime).getTime();
  const cutoffMs = getSplitDateTime(cutOffTime).getTime();

  return cutoffMs < startupMs;
};

const formatDaysOfWeek = (daysOfWeek, locale) => {
  const dayLabels = formatWeekdays(locale, "short");

  const ordered = DAYS.filter((d) => daysOfWeek.includes(d));

  const groups = [];
  let startIdx = 0;
  for (let i = 1; i <= ordered.length; i++) {
    const prev = DAYS.indexOf(ordered[i - 1]);
    const curr = DAYS.indexOf(ordered[i]);
    const isContiguous = i < ordered.length && curr === prev + 1;
    if (!isContiguous) {
      groups.push({ start: ordered[startIdx], end: ordered[i - 1] });
      startIdx = i;
    }
  }

  return groups
    .map(({ start, end }) => (start === end ? dayLabels[start] : `${dayLabels[start]}–${dayLabels[end]}`))
    .join(", ");
};

const formatTimeRange = (startTime, endTime) => {
  const [startMoment, endMoment] = [moment(startTime), moment(endTime)];
  const isAMPMEqual = startMoment.format("a") === endMoment.format("a");

  // Remove the AM/PM from the start time if they are equal
  const formattedStartTime = isAMPMEqual
    ? startMoment.format("LT").toLowerCase().replace(startMoment.format("a"), "").trim()
    : startMoment.format("LT").toLowerCase();

  const formattedEndTime = endMoment.format("LT").toLowerCase();

  return `${formattedStartTime}–${formattedEndTime}`;
};

export {
  isBetweenDates,
  formatHumanizeDuration,
  calculateNextClearTimestamp,
  getSplitTime,
  getSplitDateTime,
  compareTime,
  convertSecToMins,
  getMorningEveningDateTime,
  isBeforeMethod,
  getTimeDifference,
  getRoutineStartEndTime,
  convertTo12HourFormat,
  isDateBeforeTodaysRoutineBegan,
  formatDuration,
  isAfterCutOffTime,
  calculateDayOfUsage,
  formatTime,
  isCutoffLessThan2HoursBeforeStartup,
  isNowLessThan2HoursBeforeStartup,
  isCutoffBeforeStartup,
  formatTimeRange,
  formatDaysOfWeek,
};
