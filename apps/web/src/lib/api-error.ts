import type { UserErrorCode } from "./user-messages";

export class ApiError extends Error {
  readonly code: UserErrorCode;

  constructor(code: UserErrorCode) {
    super(code);
    this.name = "ApiError";
    this.code = code;
  }
}

export function errorCodeFromStatus(status: number): UserErrorCode {
  if (status === 404) {
    return "not_found";
  }
  if (status >= 500) {
    return "server_error";
  }
  return "load_failed";
}

export function apiErrorCodeFromUnknown(error: unknown): UserErrorCode {
  if (error instanceof ApiError) {
    return error.code;
  }
  return "load_failed";
}
