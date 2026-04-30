import { i18n } from "@/localization";
import { checkIfDistractionBlockingShouldBeEnabled } from "./use-enable-distraction-blocking";

const defaultUserData = {};

jest.mock("@/store", () => ({
  store: {
    getState: jest.fn().mockReturnValue({ user: defaultUserData }),
    subscribe: jest.fn(),
  },
}));

jest.mock("../utils/GlobalMethods", () => ({
  checkIsDev: jest.fn(),
}));

describe("checkIfDistractionBlockingShouldBeEnabled", () => {
  beforeAll(() => {
    jest.useFakeTimers("modern");
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const futureTime = "2023-12-20T12:00:00";
  const pastTime = "2023-12-18T12:00:00";
  const defaultCurrentTime = "2023-12-19T12:00:00";

  const testCases = [
    {
      description: "Enables blocking when focus mode end time is in the future, and no other conditions are met",
      currentFocusModeFinishTime: futureTime,
      isInFocusMode: false,
      isUsagePermissionGranted: true,
      isPostponeActivated: false,
      isRoutineActive: false,
      expected: { enabled: true, reason: i18n.t("distractionBlockingReason.focusModeActivated"), reasonKey: "focusModeActivated" },
    },
    {
      description: "Permissions not granted",
      isInFocusMode: false,
      isUsagePermissionGranted: false,
      isPostponeActivated: false,
      isRoutineActive: true,
      expected: { enabled: false, reason: i18n.t("distractionBlockingReason.permissionNotGranted"), reasonKey: "permissionNotGranted" },
    },
    {
      description: "Enables blocking when focus mode is past, focus mode on, permission granted, and no postponement",
      currentFocusModeFinishTime: pastTime,
      isInFocusMode: true,
      isUsagePermissionGranted: true,
      isPostponeActivated: false,
      isRoutineActive: false,
      expected: { enabled: true, reason: i18n.t("distractionBlockingReason.focusModeActivated"), reasonKey: "focusModeActivated" },
    },
    {
      description: "Disables blocking when focus mode time is past, focus mode off",
      currentFocusModeFinishTime: pastTime,
      isInFocusMode: false,
      isUsagePermissionGranted: true,
      isPostponeActivated: false,
      isRoutineActive: false,
      expected: { enabled: false, reason: i18n.t("distractionBlockingReason.defaultCase"), reasonKey: "defaultCase" },
    },
    {
      description: "Disables blocking when focus mode time is in the future but postponement is activated",
      currentFocusModeFinishTime: futureTime,
      isInFocusMode: false,
      isUsagePermissionGranted: true,
      isPostponeActivated: true,
      isRoutineActive: false,
      expected: { enabled: false, reason: i18n.t("distractionBlockingReason.postponeActivated"), reasonKey: "postponeActivated" },
    },
    {
      description: "Enables blocking when routine complete but daytime blocking is enabled",
      isDaytimeBlockingEnabled: true,
      isUsagePermissionGranted: true,
      isRoutineActive: false,
      expected: { enabled: true, reason: i18n.t("distractionBlockingReason.daytimeBlockingEnabled"), reasonKey: "daytimeBlockingEnabled" },
    },
    {
      description: "Disables blocking when user is not logged in",
      user: { accessToken: null },
      isUsagePermissionGranted: true,
      expected: { enabled: false, reason: i18n.t("distractionBlockingReason.notLoggedIn"), reasonKey: "notLoggedIn" },
    },
    {
      description: "Disables blocking when postpone is activated",
      isPostponeActivated: true,
      isUsagePermissionGranted: true,
      isRoutineActive: true,
      expected: { enabled: false, reason: i18n.t("distractionBlockingReason.postponeActivated"), reasonKey: "postponeActivated" },
    },
    {
      description: "Disables blocking before shutdown time",
      isUsagePermissionGranted: true,
      cutOffTime: "03:00", // Sleeping time
      shutdownTime: "22:00", // Stop working time
      currentTime: "2024-10-05T02:30:00", // Before shutdown time
      startupTime: "07:00",
      expected: {
        enabled: false,
        reason: i18n.t("distractionBlockingReason.withinCutoffTimeAndShutdownTime", {
          cutoff_time: "03:00",
        }),
        reasonKey: "withinCutoffTimeAndShutdownTime",
      },
    },
    {
      description: "Enables blocking after the cut-off time",
      isRoutineActive: true,
      isUsagePermissionGranted: true,
      cutOffTime: "03:00",
      shutdownTime: "23:00",
      startupTime: "07:00",
      currentTime: "2024-10-05T04:00:00", // After cutoff, still before startup
      expected: { enabled: true, reason: i18n.t("distractionBlockingReason.afterCutoffTime"), reasonKey: "afterCutoffTime" },
    },
    {
      description: "Enables blocking after the cut-off time and eveningRoutineCompleted",
      isRoutineActive: false,
      isUsagePermissionGranted: true,
      cutOffTime: "03:00",
      shutdownTime: "23:00",
      startupTime: "07:00",
      currentTime: "2024-10-05T04:00:00",
      expected: {
        enabled: true,
        reason: i18n.t("distractionBlockingReason.afterCutoffTimeAndEveningRoutineFinished"),
        reasonKey: "afterCutoffTimeAndEveningRoutineFinished",
      },
    },
    {
      description: "Disables blocking within the shutdown time",
      isUsagePermissionGranted: true,
      cutOffTime: "03:00",
      shutdownTime: "23:00",
      startupTime: "07:00",
      currentTime: "2024-10-05T23:30:00", // Inside shutdown -> cutoff -> startup window
      expected: {
        enabled: false,
        reason: i18n.t("distractionBlockingReason.withinCutoffTimeAndShutdownTime", {
          cutoff_time: "03:00",
        }),
        reasonKey: "withinCutoffTimeAndShutdownTime",
      },
    },
    {
      description: "Disables blocking before the shutdown time",
      isUsagePermissionGranted: true,
      cutOffTime: "03:00", // Sleeping time
      shutdownTime: "23:00", // Stop working time
      startupTime: "07:00", // Start of work
      currentTime: "2024-10-05T22:00:00", // Before shutdown time
      expected: { enabled: false, reason: i18n.t("distractionBlockingReason.defaultCase"), reasonKey: "defaultCase" },
    },
    {
      description: "Disable blocking after the cut-off time and postponing is enabled",
      isUsagePermissionGranted: true,
      cutOffTime: "03:00", // Sleeping time
      shutdownTime: "23:00", // Stop working time
      currentTime: "2024-10-05T04:00:00", // After cutoff time
      isPostponeActivated: true,
      expected: { enabled: false, reason: i18n.t("distractionBlockingReason.postponeActivated"), reasonKey: "postponeActivated" },
    },
    {
      description: "Disables blocking when routine IS completed and no other blocking conditions met",
      isRoutineActive: false,
      isUsagePermissionGranted: true,
      isDaytimeBlockingEnabled: false,
      expected: { enabled: false, reason: i18n.t("distractionBlockingReason.defaultCase"), reasonKey: "defaultCase" },
    },
    {
      description: "Enables blocking when routine IS completed but daytime blocking is enabled",
      isRoutineActive: false,
      isUsagePermissionGranted: true,
      isDaytimeBlockingEnabled: true,
      expected: { enabled: true, reason: i18n.t("distractionBlockingReason.daytimeBlockingEnabled"), reasonKey: "daytimeBlockingEnabled" },
    },
    {
      description: "Prioritizes postpone over routine not completed",
      isRoutineActive: true,
      isUsagePermissionGranted: true,
      isPostponeActivated: true,
      expected: { enabled: false, reason: i18n.t("distractionBlockingReason.postponeActivated") },
    },
    {
      description: "Prioritizes focus mode over routine not completed",
      isRoutineActive: true,
      isInFocusMode: true,
      isUsagePermissionGranted: true,
      expected: { enabled: true, reason: i18n.t("distractionBlockingReason.focusModeActivated") },
    },
    {
      description: "Routine NOT completed during evening routine before cutoff should still enable blocking",
      isRoutineActive: true,
      isUsagePermissionGranted: true,
      cutOffTime: "03:00",
      shutdownTime: "23:00",
      startupTime: "07:00",
      currentTime: "2024-10-05T01:00:00", // Before cutoff during evening
      expected: {
        enabled: false,
        reason: i18n.t("distractionBlockingReason.withinCutoffTimeAndShutdownTime", {
          cutoff_time: "03:00",
        }),
        reasonKey: "withinCutoffTimeAndShutdownTime",
      },
    },
  ];

  testCases.forEach(
    ({
      user: _user,
      description,
      currentFocusModeFinishTime,
      isInFocusMode,
      isUsagePermissionGranted,
      isPostponeActivated,
      isDaytimeBlockingEnabled,
      isRoutineActive,
      cutOffTime,
      expected,
      currentTime,
      shutdownTime,
      startupTime,
    }) => {
      it(description, () => {
        jest.setSystemTime(currentTime ? new Date(currentTime) : new Date(defaultCurrentTime)); // Set a specific current time
        const user = { accessToken: "someAccessToken", ..._user };
        const result = checkIfDistractionBlockingShouldBeEnabled({
          accessToken: user.accessToken,
          currentFocusModeFinishTime,
          isInFocusMode,
          isUsagePermissionGranted,
          isPostponeActivated,
          isDaytimeBlockingEnabled,
          isRoutineActive,
          cutOffTime,
          shutdownTime,
          startupTime,
        });

        expect(result.reason).toBe(expected.reason);
        expect(result.shouldEnableBlocking).toBe(expected.enabled);
      });
    },
  );
});
