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
};

export type UISchema = {
  order?: string[];
  labels?: Record<string, string>;
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
