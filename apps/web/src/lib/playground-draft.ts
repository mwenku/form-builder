import type { JsonSchema, JsonSchemaProperty, UISchema } from "@/lib/schema";
import { getFieldLabel, getFieldOrder } from "@/lib/schema";

export type FieldWidget = "text" | "email" | "textarea" | "phone" | "number" | "boolean" | "select";

export type EnumOptionDraft = {
  value: string;
  label: string;
};

export type PlaygroundFieldDraft = {
  id: string;
  key: string;
  label: string;
  widget: FieldWidget;
  required: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  enumOptions?: EnumOptionDraft[];
};

const phonePattern = "^\\+[1-9]\\d{6,14}$";

export function inferWidget(
  key: string,
  property: JsonSchemaProperty,
  uiSchema: UISchema,
): FieldWidget {
  const widget = uiSchema.widgets?.[key];
  if (widget === "phone") {
    return "phone";
  }
  if (widget === "textarea") {
    return "textarea";
  }
  if (property.type === "boolean") {
    return "boolean";
  }
  if (property.type === "number" || property.type === "integer") {
    return "number";
  }
  if (property.enum?.length) {
    return "select";
  }
  if (property.format === "email") {
    return "email";
  }
  return "text";
}

function isEditableInUi(key: string, property: JsonSchemaProperty, uiSchema: UISchema): boolean {
  const widget = inferWidget(key, property, uiSchema);
  if (widget === "phone" && property.pattern !== phonePattern) {
    return false;
  }
  if (widget === "text" && property.pattern) {
    return false;
  }
  if (widget === "text" && property.format && property.format !== "email") {
    return false;
  }
  return true;
}

export function schemaToDrafts(
  schema: JsonSchema,
  uiSchema: UISchema,
): { ok: true; drafts: PlaygroundFieldDraft[] } | { ok: false; reason: string } {
  const order = getFieldOrder(schema, uiSchema);
  const required = new Set(schema.required ?? []);
  const drafts: PlaygroundFieldDraft[] = [];

  for (const key of order) {
    const property = schema.properties?.[key];
    if (!property) {
      continue;
    }
    if (!isEditableInUi(key, property, uiSchema)) {
      return {
        ok: false,
        reason: `Field "${key}" uses settings only editable in JSON mode.`,
      };
    }

    const widget = inferWidget(key, property, uiSchema);
    const draft: PlaygroundFieldDraft = {
      id: key,
      key,
      label: getFieldLabel(key, uiSchema),
      widget,
      required: required.has(key),
      placeholder: uiSchema.placeholders?.[key] ?? uiSchema.help?.[key],
      minLength: property.minLength,
      maxLength: property.maxLength,
    };

    if (widget === "select" && property.enum?.length) {
      draft.enumOptions = property.enum.map((value) => ({
        value,
        label: uiSchema.enumLabels?.[key]?.[value] ?? value,
      }));
    }

    drafts.push(draft);
  }

  return { ok: true, drafts };
}

export function draftsToConfig(drafts: PlaygroundFieldDraft[]): {
  schema: object;
  uiSchema: object;
} {
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];
  const order: string[] = [];
  const labels: Record<string, string> = {};
  const widgets: Record<string, string> = {};
  const placeholders: Record<string, string> = {};
  const enumLabels: Record<string, Record<string, string>> = {};

  for (const field of drafts) {
    order.push(field.key);
    labels[field.key] = field.label;
    if (field.required) {
      required.push(field.key);
    }
    if (field.placeholder) {
      placeholders[field.key] = field.placeholder;
    }

    switch (field.widget) {
      case "text": {
        const property: JsonSchemaProperty = { type: "string" };
        if (field.minLength !== undefined) {
          property.minLength = field.minLength;
        }
        if (field.maxLength !== undefined) {
          property.maxLength = field.maxLength;
        }
        properties[field.key] = property;
        break;
      }
      case "email":
        properties[field.key] = { type: "string", format: "email" };
        break;
      case "textarea":
        widgets[field.key] = "textarea";
        properties[field.key] = {
          type: "string",
          maxLength: field.maxLength ?? 2000,
        };
        break;
      case "phone":
        widgets[field.key] = "phone";
        properties[field.key] = { type: "string", pattern: phonePattern };
        break;
      case "number":
        properties[field.key] = { type: "number" };
        break;
      case "boolean":
        properties[field.key] = { type: "boolean" };
        break;
      case "select": {
        const options = field.enumOptions ?? [];
        properties[field.key] = {
          type: "string",
          enum: options.map((option) => option.value),
        };
        if (options.length > 0) {
          enumLabels[field.key] = {};
          for (const option of options) {
            enumLabels[field.key][option.value] = option.label;
          }
        }
        break;
      }
    }
  }

  return {
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required,
      additionalProperties: false,
      properties,
    },
    uiSchema: {
      order,
      labels,
      ...(Object.keys(widgets).length > 0 ? { widgets } : {}),
      ...(Object.keys(placeholders).length > 0 ? { placeholders } : {}),
      ...(Object.keys(enumLabels).length > 0 ? { enumLabels } : {}),
    },
  };
}

export function createEmptyField(index: number): PlaygroundFieldDraft {
  const key = `field_${index}`;
  return {
    id: key,
    key,
    label: `Field ${index}`,
    widget: "text",
    required: false,
  };
}
