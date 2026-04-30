import { normalizeUrl } from "./StringMethods";

jest.mock("react-native-localize", () => require("react-native-localize/mock/jest"));

describe("normalizeUrl", () => {
  test("should return null for invalid URLs without domain", () => {
    expect(normalizeUrl("notaurl")).toBeNull();
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
  });

  test("should normalize URLs with http:// prefix", () => {
    expect(normalizeUrl("http://example.com")).toBe("example.com");
    expect(normalizeUrl("http://www.example.com")).toBe("example.com");
  });

  test("should normalize URLs with https:// prefix", () => {
    expect(normalizeUrl("https://example.com")).toBe("example.com");
    expect(normalizeUrl("https://www.example.com")).toBe("example.com");
  });

  test("should add https:// prefix when no protocol is provided", () => {
    expect(normalizeUrl("example.com")).toBe("example.com");
    expect(normalizeUrl("www.example.com")).toBe("example.com");
  });

  test("should handle URLs with paths and query parameters", () => {
    expect(normalizeUrl("https://example.com/path?query=1")).toBe("example.com");
    expect(normalizeUrl("example.com/path/to/something")).toBe("example.com");
  });

  test("should handle URLs with subdomains", () => {
    expect(normalizeUrl("https://sub.example.com")).toBe("sub.example.com");
    expect(normalizeUrl("sub.example.com")).toBe("sub.example.com");
  });

  test("should handle URLs with different TLDs", () => {
    expect(normalizeUrl("example.org")).toBe("example.org");
    expect(normalizeUrl("example.net")).toBe("example.net");
    expect(normalizeUrl("example.co.uk")).toBe("example.co.uk");
  });

  test("should trim whitespace from URLs", () => {
    expect(normalizeUrl("  example.com  ")).toBe("example.com");
    expect(normalizeUrl("  https://example.com  ")).toBe("example.com");
  });
});
