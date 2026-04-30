const { calculateNextClearTimestamp, getSplitTime } = require("@/utils/TimeMethods");

// Mock the current time to January 1, 2023, 09:00:00 AM
jest.useFakeTimers("modern").setSystemTime(new Date(2023, 0, 1, 9, 0, 0));

describe("calculateNextClearTimestamp", () => {
  test("returns null if no startup_time is provided", () => {
    const routineData = { startup_time: null };
    const result = calculateNextClearTimestamp(routineData);
    expect(result).toBeNull();
  });

  test("calculates correct timestamp when current time is before startup_time today", () => {
    // Set current time to 08:00 AM
    jest.setSystemTime(new Date(2023, 0, 1, 8, 0, 0));

    const { hours, min } = getSplitTime("10:30"); // Assuming startup_time is 10:30

    const routineData = { startup_time: "10:30" };
    const result = calculateNextClearTimestamp(routineData);

    const expectedTimestamp = new Date(2023, 0, 1, hours, min, 0).getTime() / 1000;
    expect(result).toBe(expectedTimestamp);
  });

  test("calculates correct timestamp when current time is after startup_time today", () => {
    // Set current time to 12:00 PM
    jest.setSystemTime(new Date(2023, 0, 1, 12, 0, 0));

    const { hours, min } = getSplitTime("10:30"); // Assuming startup_time is 10:30

    const routineData = { startup_time: "10:30" };
    const result = calculateNextClearTimestamp(routineData);

    const expectedTimestamp = new Date(2023, 0, 2, hours, min, 0).getTime() / 1000; // Next day at the same time
    expect(result).toBe(expectedTimestamp);
  });

  test("handles morning routine time correctly based on current signup time", () => {
    // Mock the current time to 08:30 AM
    jest.setSystemTime(new Date(2023, 0, 1, 8, 30, 0));

    // Assuming morning routine time is set to 09:00 AM
    const { hours, min } = getSplitTime("09:00");

    const routineData = { startup_time: "09:00" };
    const result = calculateNextClearTimestamp(routineData);

    // Expect the clear timestamp to be 09:00 AM of the same day
    const expectedTimestamp = new Date(2023, 0, 1, hours, min, 0).getTime() / 1000;
    expect(result).toBe(expectedTimestamp);
  });

  test("calculates correct timestamp when startup_time is 00:00 and current time is before and after 00:00", () => {
    // Scenario 1: Current time before 00:00 (today)
    jest.setSystemTime(new Date(2023, 0, 1, 23, 0, 0)); // Set current time to 11:00 PM

    let { hours, min } = getSplitTime("00:00"); // Assuming startup_time is 00:00

    let routineData = { startup_time: "00:00" };
    let result = calculateNextClearTimestamp(routineData);

    let expectedTimestamp = new Date(2023, 0, 2, hours, min, 0).getTime() / 1000; // Midnight of the next day
    expect(result).toBe(expectedTimestamp);

    // Scenario 2: Current time after 00:00 (today)
    jest.setSystemTime(new Date(2023, 0, 2, 1, 0, 0)); // Set current time to 1:00 AM

    result = calculateNextClearTimestamp(routineData);

    expectedTimestamp = new Date(2023, 0, 3, hours, min, 0).getTime() / 1000; // Midnight of the next day
    expect(result).toBe(expectedTimestamp);
  });

  test("calculates correct timestamp when startup_time is 08:30 and current time is before and after 08:30", () => {
    // Scenario 1: Current time before 08:30 (today)
    jest.setSystemTime(new Date(2023, 0, 1, 0, 0, 0)); // Set current time to 7:00 AM

    let { hours, min } = getSplitTime("08:30"); // Assuming startup_time is 08:30

    let routineData = { startup_time: "08:30" };
    let result = calculateNextClearTimestamp(routineData);

    let expectedTimestamp = new Date(2023, 0, 1, hours, min, 0).getTime() / 1000; // 08:30 of the same day
    expect(result).toBe(expectedTimestamp);

    // Scenario 2: Current time after 08:30 (today)
    jest.setSystemTime(new Date(2023, 0, 2, 0, 0, 0)); // Set current time to 9:00 AM

    result = calculateNextClearTimestamp(routineData);

    expectedTimestamp = new Date(2023, 0, 2, hours, min, 0).getTime() / 1000; // 08:30 of the next day
    expect(result).toBe(expectedTimestamp);
  });
});
