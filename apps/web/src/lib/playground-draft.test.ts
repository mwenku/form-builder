import { describe, expect, it } from "vitest";
import { createEmptyField, draftsToConfig, inferWidget, schemaToDrafts } from "./playground-draft";
import { PLAYGROUND_TEMPLATES } from "./playground-templates";
import { parseJsonInput } from "./playground-templates";
import type { JsonSchema, UISchema } from "./schema";

describe("playground-draft", () => {
  it("infers phone widget from ui_schema", () => {
    const widget = inferWidget(
      "phone",
      { type: "string", pattern: "^\\+[1-9]\\d{6,14}$" },
      { widgets: { phone: "phone" } },
    );
    expect(widget).toBe("phone");
  });

  it("round-trips contact template through drafts", () => {
    const template = PLAYGROUND_TEMPLATES[0];
    const parsed = schemaToDrafts(template.schema as JsonSchema, template.uiSchema as UISchema);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const rebuilt = draftsToConfig(parsed.drafts);
    const again = schemaToDrafts(rebuilt.schema as JsonSchema, rebuilt.uiSchema as UISchema);
    expect(again.ok).toBe(true);
    if (!again.ok) {
      return;
    }

    expect(again.drafts.map((field) => field.key)).toEqual(parsed.drafts.map((field) => field.key));
    expect(again.drafts.map((field) => field.widget)).toEqual(
      parsed.drafts.map((field) => field.widget),
    );
  });

  it("builds schema from a new empty field", () => {
    const { schema, uiSchema } = draftsToConfig([createEmptyField(1)]);
    expect(schema).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required: [],
      additionalProperties: false,
      properties: {
        field_1: { type: "string" },
      },
    });
    expect(uiSchema).toEqual({
      order: ["field_1"],
      labels: { field_1: "Field 1" },
    });
  });

  it("rejects schemas with unsupported patterns in UI mode", () => {
    const result = schemaToDrafts(
      {
        type: "object",
        properties: {
          code: { type: "string", pattern: "^[A-Z]{3}$" },
        },
      },
      { order: ["code"], labels: { code: "Code" } },
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.reason).toBe('Field "code" uses settings only editable in JSON mode.');
  });

  it("maps legacy help text to placeholder when loading drafts", () => {
    const result = schemaToDrafts(
      { type: "object", properties: { name: { type: "string" } } },
      { order: ["name"], labels: { name: "Name" }, help: { name: "Enter your name" } },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.drafts[0].placeholder).toBe("Enter your name");
  });

  it("round-trips placeholders through drafts", () => {
    const { uiSchema } = draftsToConfig([
      {
        id: "email",
        key: "email",
        label: "Email",
        widget: "email",
        required: true,
        placeholder: "you@example.com",
      },
    ]);
    expect(uiSchema).toEqual({
      order: ["email"],
      labels: { email: "Email" },
      placeholders: { email: "you@example.com" },
    });
  });

  it("treats empty JSON input as an empty object", () => {
    expect(parseJsonInput("")).toEqual({ ok: true, value: {} });
    expect(parseJsonInput("   \n  ")).toEqual({ ok: true, value: {} });
  });
});
