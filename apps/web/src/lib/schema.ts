export type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
};

export type JsonSchemaProperty = {
  type?: string;
  format?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

export type UISchema = {
  order?: string[];
  labels?: Record<string, string>;
  widgets?: Record<string, string>;
  placeholders?: Record<string, string>;
  help?: Record<string, string>;
  enumLabels?: Record<string, Record<string, string>>;
};

export function getFieldOrder(schema: JsonSchema, uiSchema: UISchema): string[] {
  if (uiSchema.order?.length) {
    return uiSchema.order;
  }
  if (!schema.properties) {
    return [];
  }
  return Object.keys(schema.properties);
}

export function getFieldLabel(field: string, uiSchema: UISchema): string {
  return uiSchema.labels?.[field] ?? field;
}

export function getFieldWidget(field: string, uiSchema: UISchema): string | undefined {
  return uiSchema.widgets?.[field];
}

export function getFieldPlaceholder(field: string, uiSchema: UISchema): string | undefined {
  return uiSchema.placeholders?.[field];
}

export function getFieldHelp(field: string, uiSchema: UISchema): string | undefined {
  return uiSchema.help?.[field];
}

export function getEnumLabel(field: string, value: string, uiSchema: UISchema): string {
  return uiSchema.enumLabels?.[field]?.[value] ?? value;
}

export function isPhoneField(
  field: string,
  property: JsonSchemaProperty,
  uiSchema: UISchema,
): boolean {
  return getFieldWidget(field, uiSchema) === "phone" || property.format === "phone";
}

export function isTextareaField(
  field: string,
  property: JsonSchemaProperty,
  uiSchema: UISchema,
): boolean {
  return getFieldWidget(field, uiSchema) === "textarea" || property.format === "textarea";
}
