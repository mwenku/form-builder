import { describe, expect, it } from "vitest";
import { isValidE164, parseE164, toE164 } from "./phone";

describe("parseE164", () => {
  it("parses a UK number into dial code and national parts", () => {
    expect(parseE164("+447700900123")).toEqual({
      dialCode: "+44",
      nationalNumber: "7700900123",
    });
  });

  it("defaults to UK when the value is empty", () => {
    expect(parseE164("")).toEqual({
      dialCode: "+44",
      nationalNumber: "",
    });
  });
});

describe("toE164", () => {
  it("combines dial code and national digits", () => {
    expect(toE164("+44", "7700 900 123")).toBe("+447700900123");
  });

  it("returns an empty string when no national digits are provided", () => {
    expect(toE164("+1", "   ")).toBe("");
  });
});

describe("isValidE164", () => {
  it("accepts valid international numbers", () => {
    expect(isValidE164("+14155552671")).toBe(true);
    expect(isValidE164("+447700900123")).toBe(true);
  });

  it("rejects numbers without a country code", () => {
    expect(isValidE164("7700900123")).toBe(false);
    expect(isValidE164("+0123456")).toBe(false);
  });
});
