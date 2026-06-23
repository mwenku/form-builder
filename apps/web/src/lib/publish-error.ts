import type { ValidationError } from "@/generated/api-types";
import type { UserErrorCode } from "@/lib/user-messages";

export class PublishError extends Error {
  readonly errors: ValidationError[];
  readonly code: UserErrorCode;

  constructor(errors: ValidationError[], code: UserErrorCode = "submit_failed") {
    super("publish_failed");
    this.name = "PublishError";
    this.errors = errors;
    this.code = code;
  }
}

export function formatPublishErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return "Could not publish. Run make up to rebuild the API, then try again.";
  }
  return errors
    .map((error) => (error.field ? `${error.field}: ${error.message}` : error.message))
    .join(" ");
}
