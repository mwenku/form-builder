import { describe, expect, it } from "vitest";
import { formatPublishErrors } from "./publish-error";

describe("formatPublishErrors", () => {
  it("formats field validation messages", () => {
    const message = formatPublishErrors([
      { field: "schema", message: "schema is not supported by the validation engine" },
    ]);
    expect(message).toBe("schema: schema is not supported by the validation engine");
  });

  it("suggests rebuilding the API when there are no details", () => {
    const message = formatPublishErrors([]);
    expect(message).toBe("Could not publish. Run make up to rebuild the API, then try again.");
  });
});
