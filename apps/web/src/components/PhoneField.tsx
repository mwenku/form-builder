import { COUNTRY_CALLING_CODES, parseE164, toE164 } from "@/lib/phone";

type Props = {
  id: string;
  value: unknown;
  error?: string;
  required: boolean;
  label: string;
  helpText?: string;
  onChange: (value: string) => void;
};

export function PhoneField({ id, value, error, required, label, helpText, onChange }: Props) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const hasError = Boolean(error);
  const e164 = typeof value === "string" ? value : "";
  const { dialCode, nationalNumber } = parseE164(e164);

  return (
    <div className={`field${hasError ? " field-invalid" : ""}`}>
      <label className="field-label" htmlFor={`${id}-national`}>
        {label}
        {required ? <span className="required-mark"> *</span> : null}
      </label>
      {helpText ? (
        <p id={helpId} className="field-help">
          {helpText}
        </p>
      ) : null}
      <div className="phone-field">
        <select
          id={`${id}-country`}
          className="phone-field__country"
          value={dialCode}
          aria-label={`${label} country code`}
          aria-invalid={hasError}
          aria-describedby={
            [hasError ? errorId : null, helpText ? helpId : null].filter(Boolean).join(" ") ||
            undefined
          }
          onChange={(event) => onChange(toE164(event.target.value, nationalNumber))}
        >
          {COUNTRY_CALLING_CODES.map((country) => (
            <option key={`${country.iso}-${country.dialCode}`} value={country.dialCode}>
              {country.label} ({country.dialCode})
            </option>
          ))}
        </select>
        <input
          id={`${id}-national`}
          className="phone-field__number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="7700 900123"
          value={nationalNumber}
          aria-invalid={hasError}
          aria-describedby={
            [hasError ? errorId : null, helpText ? helpId : null].filter(Boolean).join(" ") ||
            undefined
          }
          onChange={(event) => onChange(toE164(dialCode, event.target.value))}
        />
      </div>
      {error ? (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
