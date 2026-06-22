import { describe, expect, it } from "vitest";
import { friendlyValidationMessage } from "./validation-messages";

describe("friendlyValidationMessage", () => {
  it("maps missing property errors to required copy", () => {
    expect(friendlyValidationMessage("email", "missing properties: 'email'", "Email")).toBe(
      "Email is required.",
    );
  });

  it("maps email format errors to friendly copy", () => {
    expect(friendlyValidationMessage("email", "'email' is not a valid email", "Email")).toBe(
      "Enter a valid email address.",
    );
  });

  it("maps generic field errors without exposing schema text", () => {
    expect(friendlyValidationMessage("amount", "jsonschema validation failed", "Amount")).toBe(
      "Amount is invalid.",
    );
  });

  it("maps form-level errors to generic guidance", () => {
    expect(friendlyValidationMessage("", "invalid JSON body", "Form")).toBe(
      "Please check your answers and try again.",
    );
  });
});
