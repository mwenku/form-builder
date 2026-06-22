import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";

describe("ApiError", () => {
  it("exposes a stable error code for UI mapping", () => {
    const error = new ApiError("network");
    expect(error.code).toBe("network");
    expect(error.name).toBe("ApiError");
  });
});
