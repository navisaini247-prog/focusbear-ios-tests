import moment from "moment";

import { APIMethod } from "@/utils/ApiMethod";
import { APIURLS } from "@/utils/ApiUrls";
import { logAPIError } from "@/utils/FileLogger";
import { ALL, DAYS } from "@/constants/activity";
import { TYPES } from "./UserActions";
import { PAUSE_FRICTION, SCHEDULE_TYPE, BLOCKING_MODE } from "@/constants/blockingSchedule";
import { i18n } from "@/localization";

export const LEGACY_BLOCKED_APPS_METADATA_KEY = "blockedAppsArray";
export const BLOCKED_ANDROID_APPS_METADATA_KEY = "blockedAndroidAppsArray";
export const BLOCKED_URLS_METADATA_KEY = "blockUrlsArray";

const convertDaysForApi = (days) => {
  if (!Array.isArray(days) || days.length === 0) {
    return [];
  }

  const normalized = days.filter((day) => day !== ALL);
  // If all 7 days are selected, return ["ALL"] for API
  if (normalized.length === DAYS.length) {
    return [ALL];
  }

  // If normalized is empty (only ALL was in array), return ["ALL"]
  if (normalized.length === 0 && days.includes(ALL)) {
    return [ALL];
  }

  return normalized
    .map((day) => DAYS.indexOf(day))
    .filter((dayIndex) => dayIndex !== -1)
    .sort((a, b) => a - b);
};

const formatTimeForApi = (date) => moment(date).format("HH:mm:ss");

const setBlockingSchedules = (blockingSchedules) => ({
  type: TYPES.SET_BLOCKING_SCHEDULES,
  payload: { blockingSchedules },
});

const upsertBlockingSchedule = (blockingSchedule) => ({
  type: TYPES.UPSERT_BLOCKING_SCHEDULE,
  payload: { blockingSchedule },
});

const removeBlockingSchedule = (id) => ({
  type: TYPES.REMOVE_BLOCKING_SCHEDULE,
  payload: { id },
});

const buildFocusModeMetadata = (selectedApps = [], selectedUrls = []) => {
  const blockedApps = Array.isArray(selectedApps) ? selectedApps.map((app) => app?.packageName).filter(Boolean) : [];
  const blockedUrls = Array.isArray(selectedUrls) ? selectedUrls.filter(Boolean) : [];

  if (blockedApps.length === 0 && blockedUrls.length === 0) {
    return {};
  }

  const metadata = {};
  if (blockedApps.length > 0) {
    metadata[BLOCKED_ANDROID_APPS_METADATA_KEY] = blockedApps;
  }
  if (blockedUrls.length > 0) {
    metadata[BLOCKED_URLS_METADATA_KEY] = blockedUrls;
  }
  return metadata;
};

const createFocusMode = async ({ focusModeId, name, selectedApps = [], selectedUrls = [] }) => {
  const metadata = buildFocusModeMetadata(selectedApps, selectedUrls);
  const shouldSendMetadata = Object.keys(metadata).length > 0 || !focusModeId;

  // When creating a new focus mode (no focusModeId), append suffix to name to ensure uniqueness
  // When updating existing focus mode, use the original name and don't change it
  // i18n is safe here: index.js imports @/localization/i18n as a module side-effect before the app
  // renders, so i18n.init() (with all resources bundled inline) runs before any React component or
  // hook fires. useSyncBlockingSchedules only calls this inside a useEffect — post-mount — which is
  // well after module initialization. Fallback to English literal as a belt-and-suspenders guard.
  const focusModeI18nSuffix = i18n.isInitialized
    ? i18n.t("blockingSchedule.focusModeSuffix")
    : "(from mobile blocking schedule)";
  const uniqueName = focusModeId ? name : `${name} ${focusModeI18nSuffix}`;

  // When updating, only send metadata, not the name (to avoid name conflicts)
  const body = focusModeId
    ? {
        ...(shouldSendMetadata ? { metadata } : {}),
      }
    : {
        name: uniqueName,
        ...(shouldSendMetadata ? { metadata } : {}),
      };

  try {
    if (focusModeId) {
      // Backend expects PUT payload as an array of UpdateFocusModeDto
      const updatePayload = {
        ...body,
        id: focusModeId,
      };

      const response = await APIMethod({
        endpoint: APIURLS.focusMode,
        method: "PUT",
        body: [updatePayload],
        enableRetry: false,
        enableErrorMessage: false,
      });
      const data = Array.isArray(response?.data) ? response.data[0] : response?.data;
      return data ?? { id: focusModeId };
    }

    const response = await APIMethod({
      endpoint: APIURLS.focusMode,
      method: "POST",
      body: {
        ...body,
        metadata: body.metadata || {},
      },
    });
    return response?.data;
  } catch (error) {
    logAPIError("focus-mode-sync error:", error);
    if (focusModeId) {
      return { id: focusModeId };
    }
    throw error;
  }
};

// Export for reuse (e.g., legacy migration flows)
export { createFocusMode };

const buildScheduleRequestBody = ({
  scheduleId,
  name,
  startTime,
  endTime,
  selectedDays,
  blockingMode,
  focusModeId,
  isAiBlockingEnabled = false,
}) => {
  const isStrictMode = blockingMode === BLOCKING_MODE.STRICT || blockingMode === BLOCKING_MODE.SUPER_STRICT;

  return {
    id: scheduleId,
    name,
    start_time: formatTimeForApi(startTime),
    end_time: formatTimeForApi(endTime),
    days_of_week: convertDaysForApi(selectedDays),
    focus_mode_id: focusModeId,
    pause_friction: isStrictMode ? PAUSE_FRICTION.PASSWORD : PAUSE_FRICTION.NONE,
    block_level: blockingMode,
    is_ai_blocking_enabled: Boolean(isAiBlockingEnabled),
    metadata: {},
    type: SCHEDULE_TYPE.CUSTOM,
  };
};

export const fetchBlockingSchedules = () => async (dispatch) => {
  try {
    const response = await APIMethod({
      endpoint: APIURLS.blockingSchedules,
      method: "GET",
    });
    const schedules = Array.isArray(response?.data) ? response.data : [];
    dispatch(setBlockingSchedules(schedules));
    return schedules;
  } catch (error) {
    logAPIError("blocking-schedules-fetch error:", error);
    throw error;
  }
};

export const createBlockingSchedule =
  ({ scheduleId, name, startTime, endTime, selectedDays, blockingMode, selectedApps, selectedUrls }) =>
  async (dispatch) => {
    try {
      const focusMode = await createFocusMode({ name, selectedApps, selectedUrls, scheduleId });
      const body = buildScheduleRequestBody({
        scheduleId,
        name,
        startTime,
        endTime,
        selectedDays,
        blockingMode,
        focusModeId: focusMode?.id,
      });

      const response = await APIMethod({
        endpoint: APIURLS.blockingSchedules,
        method: "POST",
        body,
        enableRetry: false,
        enableErrorMessage: false,
      });

      dispatch(upsertBlockingSchedule(response?.data));
      return response?.data;
    } catch (error) {
      logAPIError("blocking-schedules-create error:", error);
      throw error;
    }
  };

export const updateBlockingSchedule =
  ({
    scheduleId,
    name,
    startTime,
    endTime,
    selectedDays,
    blockingMode,
    focusModeId,
    selectedApps,
    selectedUrls,
    isAiBlockingEnabled,
  }) =>
  async (dispatch) => {
    try {
      const hasApps = Array.isArray(selectedApps) && selectedApps.length > 0;
      const hasUrls = Array.isArray(selectedUrls) && selectedUrls.length > 0;
      if (hasApps || hasUrls) {
        await createFocusMode({ focusModeId, name, selectedApps, selectedUrls, scheduleId });
      }

      const body = buildScheduleRequestBody({
        scheduleId,
        name,
        startTime,
        endTime,
        selectedDays,
        blockingMode,
        focusModeId,
        isAiBlockingEnabled,
      });

      const response = await APIMethod({
        endpoint: APIURLS.blockingScheduleDetail(scheduleId),
        method: "PUT",
        body,
      });

      dispatch(upsertBlockingSchedule(response?.data));
      return response?.data;
    } catch (error) {
      logAPIError("blocking-schedules-update error:", error);
      throw error;
    }
  };

export const deleteBlockingSchedule =
  ({ scheduleId }) =>
  async (dispatch) => {
    try {
      await APIMethod({
        endpoint: APIURLS.blockingScheduleDetail(scheduleId),
        method: "DELETE",
      });
      dispatch(removeBlockingSchedule(scheduleId));
    } catch (error) {
      logAPIError("blocking-schedules-delete error:", error);
      throw error;
    }
  };
