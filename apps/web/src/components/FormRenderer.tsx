import type { JsonSchema, JsonSchemaProperty, UISchema } from "@/lib/schema";
import { getFieldLabel, getFieldOrder } from "@/lib/schema";

type Props = {
  schema: JsonSchema;
  uiSchema: UISchema;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (field: string, value: unknown) => void;
};

export function FormRenderer({ schema, uiSchema, values, errors, onChange }: Props) {
  const fields = getFieldOrder(schema, uiSchema);
  const required = new Set(schema.required ?? []);

  return (
    <div className="form-fields">
      {fields.map((field) => {
        const property = schema.properties?.[field];
        if (!property) {
          return null;
        }
        return (
          <DynamicField
            key={field}
            field={field}
            label={getFieldLabel(field, uiSchema)}
            property={property}
            value={values[field]}
            error={errors[field]}
            required={required.has(field)}
            onChange={onChange}
          />
        );
      })}
    </div>
  );
}

type FieldProps = {
  field: string;
  label: string;
  property: JsonSchemaProperty;
  value: unknown;
  error?: string;
  required: boolean;
  onChange: (field: string, value: unknown) => void;
};

function DynamicField({ field, label, property, value, error, required, onChange }: FieldProps) {
  const id = `field-${field}`;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  if (property.type === "boolean") {
    return (
      <div className={`field checkbox-field${hasError ? " field-invalid" : ""}`}>
        <label htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            onChange={(e) => onChange(field, e.target.checked)}
          />
          <span>
            {label}
            {required ? <span className="required-mark"> *</span> : null}
          </span>
        </label>
        {error ? (
          <span id={errorId} className="field-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  if (property.enum) {
    return (
      <div className={`field${hasError ? " field-invalid" : ""}`}>
        <label className="field-label" htmlFor={id}>
          {label}
          {required ? <span className="required-mark"> *</span> : null}
        </label>
        <select
          id={id}
          value={typeof value === "string" ? value : ""}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          onChange={(e) => onChange(field, e.target.value)}
        >
          <option value="">Select an option</option>
          {property.enum.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {error ? (
          <span id={errorId} className="field-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  const inputType =
    property.format === "email"
      ? "email"
      : property.format === "date"
        ? "date"
        : property.type === "number"
          ? "number"
          : "text";

  return (
    <div className={`field${hasError ? " field-invalid" : ""}`}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? <span className="required-mark"> *</span> : null}
      </label>
      <input
        id={id}
        type={inputType}
        value={value === undefined || value === null ? "" : String(value)}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        autoComplete={property.format === "email" ? "email" : undefined}
        onChange={(e) => {
          if (property.type === "number") {
            onChange(field, e.target.value === "" ? "" : Number(e.target.value));
          } else {
            onChange(field, e.target.value);
          }
        }}
      />
      {error ? (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
