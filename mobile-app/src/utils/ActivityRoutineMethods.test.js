import { ROUTINE_NAMES } from "@/constants";
import { ROUTINE_STATUS, ROUTINE_TRIGGER } from "@/constants/routines";
import { calculateIsMorningOrEvening, calculateIsAnyRoutineActive } from "./ActivityRoutineMethods";
import { COMPLETE_SETTINGS_DATA } from "../constants/testData/CompleteRoutineTestData";
import { getMorningEveningDateTime } from "./TimeMethods";

// Mock date 1/1/2023, 9 AM
jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] }).setSystemTime(new Date(2023, 0, 1, 9, 0, 0));

const mockStore = {
  user: {
    current_sequence_completed_activities: [],
  },
  routine: {
    fullRoutineData: { ...COMPLETE_SETTINGS_DATA },
  },
  global: {
    isBreakRoutineEnabled: false,
  },
};

jest.mock("@/store", () => ({
  store: {
    getState: jest.fn(() => mockStore),
    subscribe: jest.fn(() => jest.fn()),
  },
}));

describe("calculateIsMorningOrEvening", () => {
  it("should return ROUTINE_NAMES.MORNING when current time is within startup and shutdown times", async () => {
    // Mock the necessary variables and inputs
    const { startUpDateTime, shutDownDateTime } = getMorningEveningDateTime();

    // Call the calculateIsMorningOrEvening function
    const result = calculateIsMorningOrEvening(startUpDateTime, shutDownDateTime);

    // Check the result against the expected value
    expect(result).toBe(ROUTINE_NAMES.MORNING);
  });

  // Write more tests for other scenarios and cases
});

describe("calculateIsAnyRoutineActive", () => {
  const baseRoutineData = {
    startup_time: "08:00",
    shutdown_time: "20:00",
    cutoff_time_for_high_priority_activities: "19:00",
    morning_activities: [{ id: "m1", activity_sequence_id: "morning-seq", days_of_week: ["ALL"] }],
    evening_activities: [{ id: "e1", activity_sequence_id: "evening-seq", days_of_week: ["ALL"] }],
    custom_routines: [],
  };

  const baseTodayProgress = {
    morning_routine: { sequence_id: "morning-seq", status: null, completed_habit_ids: [] },
    evening_routine: { sequence_id: "evening-seq", status: null, completed_habit_ids: [] },
    custom_routines: [],
  };

  beforeEach(() => jest.setSystemTime(new Date(2023, 0, 1, 9, 0, 0)));

  describe("Routine status handling", () => {
    it("returns true for scheduled incomplete routines", () => {
      expect(calculateIsAnyRoutineActive(baseRoutineData, baseTodayProgress, [])).toBe(true);
    });

    it("returns false for completed routines via completed_habit_ids", () => {
      const progress = {
        ...baseTodayProgress,
        morning_routine: { ...baseTodayProgress.morning_routine, completed_habit_ids: ["m1"] },
      };
      expect(calculateIsAnyRoutineActive(baseRoutineData, progress, [])).toBe(false);
    });

    it("returns true for IN_PROGRESS status", () => {
      const progress = {
        ...baseTodayProgress,
        morning_routine: { ...baseTodayProgress.morning_routine, status: ROUTINE_STATUS.IN_PROGRESS },
      };
      expect(calculateIsAnyRoutineActive(baseRoutineData, progress, [])).toBe(true);
    });

    it("returns false for COMPLETED status", () => {
      const progress = {
        ...baseTodayProgress,
        morning_routine: { ...baseTodayProgress.morning_routine, status: ROUTINE_STATUS.COMPLETED },
      };
      expect(calculateIsAnyRoutineActive(baseRoutineData, progress, [])).toBe(false);
    });

    it("returns false when all activities are skipped", () => {
      expect(calculateIsAnyRoutineActive(baseRoutineData, baseTodayProgress, ["m1"])).toBe(false);
    });
  });

  describe("Time-based scheduling", () => {
    it("activates evening routine when outside morning time", () => {
      jest.setSystemTime(new Date(2023, 0, 1, 21, 0, 0));
      expect(calculateIsAnyRoutineActive(baseRoutineData, baseTodayProgress, [])).toBe(true);
    });

    it("handles ON_SCHEDULE custom routines within time range", () => {
      jest.setSystemTime(new Date(2023, 0, 1, 13, 0, 0));
      const data = {
        ...baseRoutineData,
        custom_routines: [
          {
            activity_sequence_id: "c1",
            trigger: ROUTINE_TRIGGER.ON_SCHEDULE,
            start_time: "12:00",
            end_time: "14:00",
            standalone_activities: [{ id: "ca1", days_of_week: ["ALL"] }],
          },
        ],
      };
      const progress = {
        ...baseTodayProgress,
        morning_routine: { ...baseTodayProgress.morning_routine, status: ROUTINE_STATUS.COMPLETED },
        custom_routines: [{ sequence_id: "c1", status: null, completed_habit_ids: [] }],
      };
      expect(calculateIsAnyRoutineActive(data, progress, [])).toBe(true);
    });

    it("ignores ON_DEMAND custom routines unless IN_PROGRESS", () => {
      jest.setSystemTime(new Date(2023, 0, 1, 13, 0, 0));
      const data = {
        ...baseRoutineData,
        custom_routines: [
          {
            activity_sequence_id: "c1",
            trigger: ROUTINE_TRIGGER.ON_DEMAND,
            start_time: "12:00",
            end_time: "14:00",
            standalone_activities: [{ id: "ca1", days_of_week: ["ALL"] }],
          },
        ],
      };
      const progressNotStarted = {
        ...baseTodayProgress,
        morning_routine: { ...baseTodayProgress.morning_routine, status: ROUTINE_STATUS.COMPLETED },
        custom_routines: [{ sequence_id: "c1", status: null, completed_habit_ids: [] }],
      };
      expect(calculateIsAnyRoutineActive(data, progressNotStarted, [])).toBe(false);

      const progressInProgress = {
        ...baseTodayProgress,
        morning_routine: { ...baseTodayProgress.morning_routine, status: ROUTINE_STATUS.COMPLETED },
        custom_routines: [{ sequence_id: "c1", status: ROUTINE_STATUS.IN_PROGRESS, completed_habit_ids: [] }],
      };
      expect(calculateIsAnyRoutineActive(data, progressInProgress, [])).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("returns false when there are no activities in any routine", () => {
      const data = { ...baseRoutineData, morning_activities: [], evening_activities: [] };
      expect(calculateIsAnyRoutineActive(data, baseTodayProgress, [])).toBe(false);
    });

    it("handles missing/null progress", () => {
      expect(calculateIsAnyRoutineActive(baseRoutineData, {}, [])).toBe(true);
      expect(calculateIsAnyRoutineActive(baseRoutineData, null, [])).toBe(true);
    });

    it("returns true when any routine is active", () => {
      jest.setSystemTime(new Date(2023, 0, 1, 13, 0, 0));
      const data = {
        ...baseRoutineData,
        custom_routines: [
          {
            activity_sequence_id: "c1",
            trigger: ROUTINE_TRIGGER.ON_SCHEDULE,
            start_time: "12:00",
            end_time: "14:00",
            standalone_activities: [{ id: "ca1", days_of_week: ["ALL"] }],
          },
        ],
      };
      const progress = {
        morning_routine: { sequence_id: "morning-seq", status: ROUTINE_STATUS.COMPLETED, completed_habit_ids: ["m1"] },
        evening_routine: { sequence_id: "evening-seq", status: null, completed_habit_ids: [] },
        custom_routines: [{ sequence_id: "c1", status: null, completed_habit_ids: [] }],
      };
      expect(calculateIsAnyRoutineActive(data, progress, [])).toBe(true);
    });

    it("returns false when all routines are completed", () => {
      jest.setSystemTime(new Date(2023, 0, 1, 21, 0, 0));
      const progress = {
        morning_routine: { sequence_id: "morning-seq", status: ROUTINE_STATUS.COMPLETED, completed_habit_ids: ["m1"] },
        evening_routine: { sequence_id: "evening-seq", status: ROUTINE_STATUS.COMPLETED, completed_habit_ids: ["e1"] },
        custom_routines: [],
      };
      expect(calculateIsAnyRoutineActive(baseRoutineData, progress, [])).toBe(false);
    });
  });
});
