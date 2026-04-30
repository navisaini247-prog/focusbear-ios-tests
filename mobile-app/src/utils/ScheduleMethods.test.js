import { store } from "@/store";
import { isAfterCutOffTime } from "@/utils/TimeMethods";
import { isActivityAvailableAfterCutOffTime, isActivityAvailableToday } from "@/utils/ScheduleMethods";
import { ACTIVITY_PRIORITY } from "./Enums";

jest.mock("@/store", () => ({
  store: {
    getState: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock("@/utils/TimeMethods", () => ({
  isAfterCutOffTime: jest.fn(),
}));

jest.mock("moment", () => {
  const mockMoment = () => ({
    day: jest.fn().mockReturnValue(1), // monday
  });
  return mockMoment;
});

describe("isActivityAvailableAfterCutOffTime", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.getState.mockReturnValue({
      routine: { fullRoutineData: { startup_time: "12:00" } },
    });
  });

  test("returns true when no activity.cutoff_time_for_doing_activity is set", () => {
    const activity = { priority: ACTIVITY_PRIORITY.STANDARD };
    isAfterCutOffTime.mockReturnValue(false); // Not past current time

    expect(isActivityAvailableAfterCutOffTime(activity, "11:00")).toBe(true);
  });

  test("returns false when activity.cutoff_time_for_doing_activity is past current time", () => {
    const activity = { cutoff_time_for_doing_activity: "10:00", priority: ACTIVITY_PRIORITY.STANDARD };
    isAfterCutOffTime.mockReturnValue(true); // past current time

    expect(isActivityAvailableAfterCutOffTime(activity, "11:00")).toBe(false);
  });

  test("returns true when activity.cutoff_time_for_doing_activity is not past current time", () => {
    const activity = { cutoff_time_for_doing_activity: "13:00", priority: ACTIVITY_PRIORITY.STANDARD };
    isAfterCutOffTime.mockReturnValue(false); // not past current time

    expect(isActivityAvailableAfterCutOffTime(activity, "11:00")).toBe(true);
  });

  test("allows only HIGH priority activities when general cutoff time is past current time", () => {
    const activity = { priority: ACTIVITY_PRIORITY.HIGH };
    isAfterCutOffTime.mockReturnValue(true); // past current time

    expect(isActivityAvailableAfterCutOffTime(activity, "11:00")).toBe(true);
  });

  test("blocks LOW priority activities when general cutoff time is past current time", () => {
    const activity = { priority: ACTIVITY_PRIORITY.STANDARD };
    isAfterCutOffTime.mockReturnValue(true); // past current time

    expect(isActivityAvailableAfterCutOffTime(activity, "11:00")).toBe(false);
  });

  test("returns true when general cutoff time is not past current time", () => {
    const activity = { priority: ACTIVITY_PRIORITY.STANDARD };
    isAfterCutOffTime.mockReturnValue(false); // not past current time

    expect(isActivityAvailableAfterCutOffTime(activity, "15:00")).toBe(true);
  });
});

describe("isActivityAvailableToday", () => {
  test("returns true when activity has no days_of_week set", () => {
    const activity = { name: "Test habit" };

    expect(isActivityAvailableToday(activity)).toBe(true);
  });

  test("returns true when days_of_week includes ALL", () => {
    const activity = { days_of_week: ["ALL"] };

    expect(isActivityAvailableToday(activity)).toBe(true);
  });

  test("returns true when days_of_week includes the current day", () => {
    const activity = { days_of_week: ["MON"] };

    expect(isActivityAvailableToday(activity)).toBe(true);
  });

  test("returns false when days_of_week does not include the current day", () => {
    const activity = { days_of_week: ["TUE", "WED"] };

    expect(isActivityAvailableToday(activity)).toBe(false);
  });

  test("uses numeric day index instead of locale-dependent name (core bug fix)", () => {
    const activity = { days_of_week: ["MON"] };

    expect(isActivityAvailableToday(activity)).toBe(true);
  });
});
