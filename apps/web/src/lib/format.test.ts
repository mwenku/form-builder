import { describe, expect, it } from "vitest";
import { formatAnswerValue, formatSubmittedAt } from "./format";

describe("formatSubmittedAt", () => {
  it("formats a valid ISO timestamp", () => {
    const formatted = formatSubmittedAt("2024-06-15T14:30:00.000Z");
    expect(formatted.includes("2024")).toBe(true);
  });

  it("returns the original value when parsing fails", () => {
    expect(formatSubmittedAt("not-a-date")).toBe("not-a-date");
  });
});

describe("formatAnswerValue", () => {
  it("formats booleans as yes or no", () => {
    expect(formatAnswerValue(true)).toBe("Yes");
    expect(formatAnswerValue(false)).toBe("No");
  });

  it("returns an em dash for empty values", () => {
    expect(formatAnswerValue(null)).toBe("-");
    expect(formatAnswerValue(undefined)).toBe("-");
  });
});
