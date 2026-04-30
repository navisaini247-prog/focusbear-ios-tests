import { checkIsAndroid } from "@/utils/PlatformMethods";

export enum StepKey {
  Intro = "intro",
  ScreenTimePermission = "screen_time_permission",
  WhatYouNeed = "what_you_need",
  ScheduleCreated = "schedule_created",
  Finish = "finish",
  UsagePermission = "usage_permission",
  OverlayIntro = "overlay_intro",
  OverlayPermissionVisual = "overlay_permission_visual",
  ScheduleSetup = "schedule_setup",
}

export type StepConfig = {
  key: StepKey;
  showSkip: boolean;
  progressStep: number;
  primaryLabel: string;
};

export const PROGRESS_STEPS_IOS = 4;
export const PROGRESS_STEPS_ANDROID = 5;

/** Builds the ordered step list for iOS onboarding flow. */
export const createStepsIOS = (t: (key: string) => string): StepConfig[] => [
  {
    key: StepKey.Intro,
    showSkip: true,
    progressStep: 1,
    primaryLabel: t("blockingPermissionIntro.introPrimary"),
  },
  {
    key: StepKey.ScreenTimePermission,
    showSkip: true,
    progressStep: 2,
    primaryLabel: t("blockingPermissionIntro.howItWorksPrimary"),
  },
  {
    key: StepKey.WhatYouNeed,
    showSkip: true,
    progressStep: 3,
    primaryLabel: t("blockingPermissionIntro.whatYouNeedPrimary"),
  },
  {
    key: StepKey.ScheduleCreated,
    showSkip: false,
    progressStep: 3,
    primaryLabel: t("blockingPermissionIntro.scheduleCreatedPrimary"),
  },
  { key: StepKey.Finish, showSkip: false, progressStep: 0, primaryLabel: "" },
];

/** Builds the ordered step list for Android onboarding flow. */
export const createStepsAndroid = (
  t: (key: string) => string,
  isUsageGranted: boolean,
  isOverlayGranted: boolean,
): StepConfig[] => [
  {
    key: StepKey.Intro,
    showSkip: true,
    progressStep: 1,
    primaryLabel: t("blockingPermissionIntro.introPrimary"),
  },
  {
    key: StepKey.UsagePermission,
    showSkip: true,
    progressStep: 2,
    primaryLabel: isUsageGranted
      ? t("blockingPermissionIntro.androidProceedPrimary")
      : t("blockingPermissionIntro.androidUsagePrimary"),
  },
  {
    key: StepKey.OverlayIntro,
    showSkip: true,
    progressStep: 3,
    primaryLabel: t("blockingPermissionIntro.androidOverlayPrimary"),
  },
  {
    key: StepKey.OverlayPermissionVisual,
    showSkip: true,
    progressStep: 4,
    primaryLabel: isOverlayGranted
      ? t("blockingPermissionIntro.androidProceedPrimary")
      : t("blockingPermissionIntro.androidPermissionVisualPrimary"),
  },
  {
    key: StepKey.ScheduleSetup,
    showSkip: true,
    progressStep: 5,
    primaryLabel: t("blockingPermissionIntro.androidScheduleSetupPrimary"),
  },
  {
    key: StepKey.ScheduleCreated,
    showSkip: false,
    progressStep: 5,
    primaryLabel: t("blockingPermissionIntro.scheduleCreatedPrimary"),
  },
  { key: StepKey.Finish, showSkip: false, progressStep: 0, primaryLabel: "" },
];

/** Returns the total number of progress steps for the current platform. */
export const getTotalProgressSteps = (): number => (checkIsAndroid() ? PROGRESS_STEPS_ANDROID : PROGRESS_STEPS_IOS);
