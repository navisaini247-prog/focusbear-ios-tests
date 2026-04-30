// TurboModule spec for BlockingScheduleModule
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export type BlockingSchedulePayload = {
  id: string;
  name: string;
  interval: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
  daysOfWeek: string[];
  blockingMode?: "gentle" | "strict" | "super-strict";
  blockedPackages?: string[];
  blockedUrls?: string[];
};

export type BlockedAppInfo = {
  packageName: string;
  appName: string;
  icon: string;
};

export type BlockingScheduleSummary = {
  id: string;
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  daysOfWeek: string[];
  blockingMode?: "gentle" | "strict" | "super-strict";
  isActive: boolean;
  type?: string;
  blockedPackages?: string[];
  blockedUrls?: string[];
  blockedAppInfos?: BlockedAppInfo[];
};

export type BlockingScheduleStatus = {
  isScheduleBlocking: boolean;
  activeScheduleIds: string[];
  activeScheduleNames: string[];
  activeScheduleCount: number;
  hasGlobalSelection: boolean;
  isPaused: boolean;
  pauseState: string;
  pauseUntil: number | null;
  totalApplications: number;
};

export interface Spec extends TurboModule {
  setBlockingSchedules(payload: string): Promise<void>;
  removeBlockingSchedule(id: string): Promise<void>;
  clearAllBlockingSchedules(): Promise<void>;
  getBlockingSchedules(): Promise<BlockingScheduleSummary[]>;
  getScheduleById(id: string): Promise<BlockingScheduleSummary | null>;
  getScheduleBlockingStatus(): Promise<BlockingScheduleStatus>;
  // Android-only: exact alarm permission helpers
  canScheduleExactAlarms(): Promise<boolean>;
  openExactAlarmSettings(): Promise<void>;
  // Android-only: set per-schedule blocked packages
  setScheduleBlockedPackages(id: string, packages: string[]): Promise<void>;
  // Android-only: set per-schedule blocked URLs
  setScheduleBlockedUrls(id: string, urls: string[]): Promise<void>;
  // Android-only: set per-schedule selection with metadata
  setScheduleBlockedSelection(
    id: string,
    selection: Array<{ packageName: string; appName: string; icon: string }>,
  ): Promise<void>;
  // Android-only: global habit blocking toggle
  getGlobalHabitBlockingEnabled(): Promise<boolean>;
  setGlobalHabitBlockingEnabled(enabled: boolean): Promise<void>;
  // Android-only: pause/resume blocking
  pauseBlockingWithResume(hours: number, minutes: number, reason: string): Promise<void>;
  pauseSchedulesIndefinitely(): Promise<void>;
  resumeScheduleBlocking(): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>("BlockingScheduleModule");
