import { describe, expect, it } from "vitest";
import { getFieldOrder } from "./schema";

describe("getFieldOrder", () => {
  it("uses ui schema order when provided", () => {
    const order = getFieldOrder(
      { properties: { b: { type: "string" }, a: { type: "string" } } },
      { order: ["a", "b"] },
    );
    expect(order).toEqual(["a", "b"]);
  });

  it("falls back to schema property keys", () => {
    const order = getFieldOrder({ properties: { x: { type: "string" } } }, {});
    expect(order).toEqual(["x"]);
  });
});
