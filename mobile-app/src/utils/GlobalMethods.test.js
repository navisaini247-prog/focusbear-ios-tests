import { isValidEmail } from "./GlobalUtils";

describe("validateEmail", () => {
  it("Positive: should return VALID for a standard email address", () => {
    const result = isValidEmail("testemail@gmail.com");

    expect(result).toBe(true);
  });

  it("Positive: should return VALID for an email with accepted special characters", () => {
    const result = isValidEmail("just.a-test+email@gmail.com");

    expect(result).toBe(true);
  });

  it("Positive: should return VALID for previous failing case", () => {
    const result = isValidEmail("usersname@company.consulting");

    expect(result).toBe(true);
  });

  it("Negative: should return INVALID for email with whitespace", () => {
    const result = isValidEmail("name @company.org");

    expect(result).toBe(false);
  });

  it("Negative: should return INVALID for email with trailing period", () => {
    const result = isValidEmail("name@company.org.");

    expect(result).toBe(false);
  });
});
