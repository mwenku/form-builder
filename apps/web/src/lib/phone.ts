export type CountryCallingCode = {
  iso: string;
  dialCode: string;
  label: string;
};

export const COUNTRY_CALLING_CODES: CountryCallingCode[] = [
  { iso: "GB", dialCode: "+44", label: "United Kingdom" },
  { iso: "US", dialCode: "+1", label: "United States" },
  { iso: "CA", dialCode: "+1", label: "Canada" },
  { iso: "IE", dialCode: "+353", label: "Ireland" },
  { iso: "DE", dialCode: "+49", label: "Germany" },
  { iso: "FR", dialCode: "+33", label: "France" },
  { iso: "NL", dialCode: "+31", label: "Netherlands" },
  { iso: "BE", dialCode: "+32", label: "Belgium" },
  { iso: "ES", dialCode: "+34", label: "Spain" },
  { iso: "IT", dialCode: "+39", label: "Italy" },
  { iso: "PT", dialCode: "+351", label: "Portugal" },
  { iso: "SE", dialCode: "+46", label: "Sweden" },
  { iso: "NO", dialCode: "+47", label: "Norway" },
  { iso: "DK", dialCode: "+45", label: "Denmark" },
  { iso: "CH", dialCode: "+41", label: "Switzerland" },
  { iso: "AT", dialCode: "+43", label: "Austria" },
  { iso: "PL", dialCode: "+48", label: "Poland" },
  { iso: "ZA", dialCode: "+27", label: "South Africa" },
  { iso: "NG", dialCode: "+234", label: "Nigeria" },
  { iso: "KE", dialCode: "+254", label: "Kenya" },
  { iso: "IN", dialCode: "+91", label: "India" },
  { iso: "SG", dialCode: "+65", label: "Singapore" },
  { iso: "AU", dialCode: "+61", label: "Australia" },
  { iso: "NZ", dialCode: "+64", label: "New Zealand" },
  { iso: "BR", dialCode: "+55", label: "Brazil" },
  { iso: "MX", dialCode: "+52", label: "Mexico" },
  { iso: "JP", dialCode: "+81", label: "Japan" },
  { iso: "AE", dialCode: "+971", label: "United Arab Emirates" },
];

const DIAL_CODES_LONGEST_FIRST = [...COUNTRY_CALLING_CODES].sort(
  (left, right) => right.dialCode.length - left.dialCode.length,
);

export const DEFAULT_DIAL_CODE = "+44";

export const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

export function parseE164(value: string): { dialCode: string; nationalNumber: string } {
  if (!value || !value.startsWith("+")) {
    return { dialCode: DEFAULT_DIAL_CODE, nationalNumber: "" };
  }

  for (const country of DIAL_CODES_LONGEST_FIRST) {
    if (value.startsWith(country.dialCode)) {
      return {
        dialCode: country.dialCode,
        nationalNumber: value.slice(country.dialCode.length),
      };
    }
  }

  return { dialCode: DEFAULT_DIAL_CODE, nationalNumber: value.slice(1) };
}

export function toE164(dialCode: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  return `${dialCode}${digits}`;
}

export function isValidE164(value: string): boolean {
  return E164_PATTERN.test(value);
}
