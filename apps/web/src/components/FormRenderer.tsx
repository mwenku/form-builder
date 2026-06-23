import type { JsonSchema, JsonSchemaProperty, UISchema } from "@/lib/schema";
import {
  getEnumLabel,
  getFieldHelp,
  getFieldLabel,
  getFieldOrder,
  getFieldPlaceholder,
  isPhoneField,
  isTextareaField,
} from "@/lib/schema";
import { PhoneField } from "@/components/PhoneField";

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
            uiSchema={uiSchema}
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
  uiSchema: UISchema;
  value: unknown;
  error?: string;
  required: boolean;
  onChange: (field: string, value: unknown) => void;
};

function DynamicField({
  field,
  label,
  property,
  uiSchema,
  value,
  error,
  required,
  onChange,
}: FieldProps) {
  const id = `field-${field}`;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const hasError = Boolean(error);
  const helpText = getFieldHelp(field, uiSchema);
  const placeholder = getFieldPlaceholder(field, uiSchema);
  const describedBy =
    [hasError ? errorId : null, helpText ? helpId : null].filter(Boolean).join(" ") || undefined;

  if (isPhoneField(field, property, uiSchema)) {
    return (
      <PhoneField
        id={id}
        label={label}
        value={value}
        error={error}
        required={required}
        helpText={helpText}
        placeholder={placeholder}
        onChange={(nextValue) => onChange(field, nextValue)}
      />
    );
  }

  if (property.type === "boolean") {
    return (
      <div className={`field checkbox-field${hasError ? " field-invalid" : ""}`}>
        <label htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            onChange={(event) => onChange(field, event.target.checked)}
          />
          <span>
            {label}
            {required ? <span className="required-mark"> *</span> : null}
          </span>
        </label>
        {helpText ? (
          <p id={helpId} className="field-help">
            {helpText}
          </p>
        ) : null}
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
        {helpText ? (
          <p id={helpId} className="field-help">
            {helpText}
          </p>
        ) : null}
        <select
          id={id}
          value={typeof value === "string" ? value : ""}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          onChange={(event) => onChange(field, event.target.value)}
        >
          <option value="">Select an option</option>
          {property.enum.map((option) => (
            <option key={option} value={option}>
              {getEnumLabel(field, option, uiSchema)}
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

  if (isTextareaField(field, property, uiSchema)) {
    return (
      <div className={`field${hasError ? " field-invalid" : ""}`}>
        <label className="field-label" htmlFor={id}>
          {label}
          {required ? <span className="required-mark"> *</span> : null}
        </label>
        {helpText ? (
          <p id={helpId} className="field-help">
            {helpText}
          </p>
        ) : null}
        <textarea
          id={id}
          rows={4}
          placeholder={placeholder}
          value={value === undefined || value === null ? "" : String(value)}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          onChange={(event) => onChange(field, event.target.value)}
        />
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
      {helpText ? (
        <p id={helpId} className="field-help">
          {helpText}
        </p>
      ) : null}
      <input
        id={id}
        type={inputType}
        placeholder={placeholder}
        min={property.type === "number" ? property.minimum : undefined}
        max={property.type === "number" ? property.maximum : undefined}
        step={property.type === "number" ? "0.01" : undefined}
        value={value === undefined || value === null ? "" : String(value)}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        autoComplete={
          property.format === "email" ? "email" : property.format === "tel" ? "tel" : undefined
        }
        onChange={(event) => {
          if (property.type === "number") {
            onChange(field, event.target.value === "" ? "" : Number(event.target.value));
          } else {
            onChange(field, event.target.value);
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
