const { isAfterCutOffTime } = require("./TimeMethods");

describe("isAfterCutOffTime", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("returns false if cutOffTime or startUpTime is missing", () => {
    expect(isAfterCutOffTime(null, "08:00")).toBe(false);
    expect(isAfterCutOffTime("22:00", null)).toBe(false);
    expect(isAfterCutOffTime(null, null)).toBe(false);
  });

  it("returns true when current time is after cutOffTime on the same day", () => {
    jest.setSystemTime(new Date("2023-01-08T23:00:00")); // 11:00 PM
    expect(isAfterCutOffTime("22:00", "06:00")).toBe(true);
  });

  it("returns false when current time is before cutOffTime on the same day", () => {
    jest.setSystemTime(new Date("2023-01-08T21:00:00")); // 9:00 PM
    expect(isAfterCutOffTime("22:00", "06:00")).toBe(false);
  });

  it("returns true when current time is after adjusted cutOffTime (past midnight)", () => {
    jest.setSystemTime(new Date("2023-01-08T02:00:00")); // 2:00 AM
    expect(isAfterCutOffTime("22:00", "06:00")).toBe(true);
  });

  it("returns true when current time is before both cutOffTime and startUpTime (past midnight)", () => {
    jest.setSystemTime(new Date("2023-01-08T01:00:00")); // 1:00 AM
    expect(isAfterCutOffTime("22:00", "06:00")).toBe(true);
  });

  it("returns false when current time is exactly at cutOffTime", () => {
    jest.setSystemTime(new Date("2023-01-08T22:00:00")); // 10:00 PM
    expect(isAfterCutOffTime("22:00", "06:00")).toBe(false);
  });

  it("handles edge case where startUpTime and cutOffTime are close", () => {
    jest.setSystemTime(new Date("2023-01-08T05:59:00")); // 5:59 AM
    expect(isAfterCutOffTime("22:00", "06:00")).toBe(true);

    jest.setSystemTime(new Date("2023-01-08T06:00:00")); // 6:00 AM
    expect(isAfterCutOffTime("22:00", "06:00")).toBe(false);
  });

  it("returns true when current time is between 02:00 and 10:00 (non-wraparound range)", () => {
    jest.setSystemTime(new Date("2023-01-08T03:00:00")); // 3:00 AM
    expect(isAfterCutOffTime("02:00", "10:00")).toBe(true);
  });

  it("returns false when current time is before cutoff in non-wraparound case", () => {
    jest.setSystemTime(new Date("2023-01-08T01:59:00")); // 1:59 AM
    expect(isAfterCutOffTime("02:00", "10:00")).toBe(false);
  });

  it("returns false when current time is exactly at cutoff in non-wraparound case", () => {
    jest.setSystemTime(new Date("2023-01-08T02:00:00")); // 2:00 AM
    expect(isAfterCutOffTime("02:00", "10:00")).toBe(false);
  });

  it("returns false when current time is exactly at startup in non-wraparound case", () => {
    jest.setSystemTime(new Date("2023-01-08T10:00:00")); // 10:00 AM
    expect(isAfterCutOffTime("02:00", "10:00")).toBe(false);
  });
});
