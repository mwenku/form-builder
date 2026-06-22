export function friendlyValidationMessage(
  field: string,
  rawMessage: string,
  fieldLabel: string,
): string {
  const message = rawMessage.toLowerCase();

  if (message.includes("required") || message.includes("missing")) {
    return `${fieldLabel} is required.`;
  }
  if (message.includes("email") && (message.includes("format") || message.includes("valid"))) {
    return `Enter a valid email address.`;
  }
  if (message.includes("format") && message.includes("date")) {
    return `Enter a valid date.`;
  }
  if (message.includes("minimum") || message.includes("less than")) {
    return `${fieldLabel} is below the allowed minimum.`;
  }
  if (message.includes("enum") || message.includes("allowed values")) {
    return `Choose a valid option for ${fieldLabel}.`;
  }
  if (message.includes("type")) {
    return `${fieldLabel} has an invalid value.`;
  }
  if (field === "" || field === "_form") {
    return "Please check your answers and try again.";
  }
  return `${fieldLabel} is invalid.`;
}
