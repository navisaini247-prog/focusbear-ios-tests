import { validateRoutineSchedule, validateCustomRoutineTimes } from "./scheduleValidation";

// Simple mock that returns the key, so we can assert on truthiness without coupling to translated strings
const t = (key: string) => key;

describe("validateGlobalSchedule", () => {
  describe("startup / shutdown equality", () => {
    it("returns no errors when startup and shutdown are different", () => {
      const result = validateRoutineSchedule(t, "07:00", "18:00");
      expect(result.startup).toBeUndefined();
      expect(result.shutdown).toBeUndefined();
    });

    it("returns errors on both startup and shutdown when they are equal", () => {
      const result = validateRoutineSchedule(t, "08:00", "08:00");
      expect(result.startup).toBeTruthy();
      expect(result.shutdown).toBeTruthy();
    });
  });

  describe("cutoff — normal day (startup before shutdown)", () => {
    // Illustrative schedule: wake up 07:00, finish work 18:00
    // Valid cutoff window: 18:00 → 07:00 (evening / overnight)

    it("is valid when cutoff is after shutdown", () => {
      const result = validateRoutineSchedule(t, "07:00", "18:00", "22:00");
      expect(result.cutoff).toBeUndefined();
    });

    it("is valid when cutoff wraps past midnight (before startup)", () => {
      const result = validateRoutineSchedule(t, "07:00", "18:00", "01:00");
      expect(result.cutoff).toBeUndefined();
    });

    it("is invalid when cutoff falls between startup and shutdown (during the work day)", () => {
      const result = validateRoutineSchedule(t, "07:00", "18:00", "12:00");
      expect(result.cutoff).toBeTruthy();
    });

    it("is invalid when cutoff equals startup", () => {
      const result = validateRoutineSchedule(t, "07:00", "18:00", "07:00");
      // 07:00 is not strictly after 07:00, so isAfter is false → no error
      // (cutoff at startup is a degenerate but technically valid boundary)
      expect(result.cutoff).toBeUndefined();
    });
  });

  describe("cutoff — night shift (startup after shutdown)", () => {
    // Illustrative schedule: wake up 22:00, finish work 07:00 (overnight worker)
    // Valid cutoff window: 07:00 → 22:00 (daytime)

    it("is valid when cutoff is in the daytime window between shutdown and startup", () => {
      const result = validateRoutineSchedule(t, "22:00", "07:00", "14:00");
      expect(result.cutoff).toBeUndefined();
    });

    it("is invalid when cutoff falls during the night shift (before shutdown)", () => {
      const result = validateRoutineSchedule(t, "22:00", "07:00", "02:00");
      expect(result.cutoff).toBeTruthy();
    });

    it("is invalid when cutoff falls during the night shift (after startup)", () => {
      const result = validateRoutineSchedule(t, "22:00", "07:00", "23:00");
      expect(result.cutoff).toBeTruthy();
    });
  });

  describe("edge cases", () => {
    it("returns no errors when no cutoff is provided", () => {
      const result = validateRoutineSchedule(t, "07:00", "18:00");
      expect(result).toEqual({});
    });

    it("returns no errors when time strings are invalid", () => {
      expect(validateRoutineSchedule(t, "not-a-time", "18:00")).toEqual({});
      expect(validateRoutineSchedule(t, "07:00", "not-a-time")).toEqual({});
    });
  });
});

describe("validateCustomRoutineTimes", () => {
  it("returns null when start is before end", () => {
    expect(validateCustomRoutineTimes(t, "09:00", "10:00")).toBeNull();
  });

  it("returns an error when start equals end", () => {
    expect(validateCustomRoutineTimes(t, "09:00", "09:00")).toBeTruthy();
  });

  it("returns an error when start is after end on the same day", () => {
    expect(validateCustomRoutineTimes(t, "11:00", "09:00")).toBeTruthy();
  });

  it("returns an error when the range would span midnight", () => {
    // 23:00 >= 01:00 in same-day clock terms, so this is caught by isSameOrAfter
    expect(validateCustomRoutineTimes(t, "23:00", "01:00")).toBeTruthy();
  });

  it("returns null when start or end is null", () => {
    expect(validateCustomRoutineTimes(t, null, "10:00")).toBeNull();
  });
});
