import {
  DEFAULT_BLOCKING_MODE,
  DEFAULT_SCHEDULE_TYPE,
  BLOCKING_MODE,
  PAUSE_FRICTION,
  SCHEDULE_TYPE,
} from "@/constants/blockingSchedule";
import { DAYS, ALL } from "@/constants/activity";
import { getSplitTime } from "@/utils/TimeMethods";

type ApiSchedule = {
  id: string;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  user_id: string;
  name: string;
  start_time: string; // HH:mm:ss format (e.g., "23:00:00")
  end_time: string; // HH:mm:ss format (e.g., "00:00:00")
  days_of_week: Array<string | number>; // Array of numbers (0-6) or day strings
  focus_mode_id?: string;
  pause_friction?: (typeof PAUSE_FRICTION)[keyof typeof PAUSE_FRICTION];
  block_level?: (typeof BLOCKING_MODE)[keyof typeof BLOCKING_MODE];
  is_ai_blocking_enabled?: boolean;
  type?: string;
  metadata?: Record<string, unknown>;
  focus_mode?: {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    name: string;
    metadata?: Record<string, unknown>;
    focus_mode_template_id?: string | null;
    deleted_at?: string | null;
    tags?: unknown[];
  };
};

type NativeSchedulePayload = {
  id: string;
  name: string;
  interval: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
  daysOfWeek: string[];
  blockingMode?: (typeof BLOCKING_MODE)[keyof typeof BLOCKING_MODE];
  type?: (typeof SCHEDULE_TYPE)[keyof typeof SCHEDULE_TYPE];
  focusModeId?: string;
  isAiBlockingEnabled?: boolean;
  pauseFriction?: (typeof PAUSE_FRICTION)[keyof typeof PAUSE_FRICTION];
};

/**
 * Convert API days format (numbers or strings) to native day codes
 * API uses ["ALL"] to represent all days, which we convert to all 7 day codes
 */
export const convertDaysFromApi = (days: Array<string | number> = []): string[] => {
  if (!Array.isArray(days) || days.length === 0) {
    return [];
  }

  // If API returns ["ALL"], convert to all 7 days
  if (days.includes("ALL") || days.includes(ALL)) {
    return [...DAYS];
  }

  return days
    .map((day) => {
      if (typeof day === "string") {
        return day;
      }
      // Use DAYS constant with index mapping (0 = Sunday, 6 = Saturday)
      return DAYS[day];
    })
    .filter(Boolean) as string[];
};

/**
 * Build native schedule payload from API schedule format
 */
export const buildNativePayload = (schedule: ApiSchedule): NativeSchedulePayload => {
  const { hours: startHour, min: startMinute } = getSplitTime(schedule.start_time);
  const { hours: endHour, min: endMinute } = getSplitTime(schedule.end_time);

  const focusModeId = schedule.focus_mode_id;

  return {
    id: schedule.id,
    name: schedule.name,
    interval: {
      startHour,
      startMinute,
      endHour,
      endMinute,
    },
    daysOfWeek: convertDaysFromApi(schedule.days_of_week),
    blockingMode: (schedule.block_level || DEFAULT_BLOCKING_MODE) as (typeof BLOCKING_MODE)[keyof typeof BLOCKING_MODE],
    type: DEFAULT_SCHEDULE_TYPE,
    focusModeId,
    isAiBlockingEnabled: schedule.is_ai_blocking_enabled,
    pauseFriction: schedule.pause_friction,
  };
};

/**
 * Build blocked app info objects with app names and icons
 */
export const buildBlockedAppInfos = (
  packageNames: string[] = [],
  appMap: Map<string, { appName: string; icon: string }> | null,
) =>
  packageNames.filter(Boolean).map((packageName) => {
    const info = appMap?.get(packageName);
    return {
      packageName,
      appName: info?.appName || packageName,
      icon: info?.icon || "",
    };
  });
