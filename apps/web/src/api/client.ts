import type {
  ErrorResponse,
  FormConfig,
  FormIntegrityView,
  FormSubmissionsView,
  FormSummary,
  PublishFormRequest,
  PublishFormVersionRequest,
  SubmissionSummary,
  ValidationError,
} from "@/generated/api-types";
import { ApiError, errorCodeFromStatus } from "@/lib/api-error";
import type { UserErrorCode } from "@/lib/user-messages";
import { apiUrl } from "./config";

export type PublishResult =
  | { ok: true; form: FormConfig }
  | { ok: false; errors: ValidationError[]; code?: UserErrorCode };

async function parseJSON<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("server_error");
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path));
  } catch {
    throw new ApiError("network");
  }
  if (!response.ok) {
    throw new ApiError(errorCodeFromStatus(response.status));
  }
  return parseJSON<T>(response);
}

async function postPublish(path: string, body: unknown): Promise<PublishResult> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, errors: [], code: "network" };
  }

  if (response.status === 201) {
    const form = await parseJSON<FormConfig>(response);
    return { ok: true, form };
  }

  if (response.status === 400) {
    const errorBody = await parseJSON<ErrorResponse>(response);
    return { ok: false, errors: errorBody.errors ?? [] };
  }

  return { ok: false, errors: [], code: errorCodeFromStatus(response.status) };
}

function assertArray<T>(value: unknown, code: "load_failed" = "load_failed"): T[] {
  if (!Array.isArray(value)) {
    throw new ApiError(code);
  }
  return value;
}

function assertObject<T extends object>(value: unknown, code: "load_failed" = "load_failed"): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(code);
  }
  return value as T;
}

export async function fetchForms(includeArchived = false): Promise<FormSummary[]> {
  const query = includeArchived ? "?archived=true" : "";
  const data = await request<unknown>(`/forms${query}`);
  return assertArray<FormSummary>(data);
}

export async function fetchForm(id: string): Promise<FormConfig> {
  const data = await request<unknown>(`/forms/${id}`);
  return assertObject<FormConfig>(data);
}

export async function fetchIntegrity(id: string): Promise<FormIntegrityView> {
  const data = await request<unknown>(`/forms/${id}/integrity`);
  return assertObject<FormIntegrityView>(data);
}

export async function fetchSubmissions(id: string): Promise<FormSubmissionsView> {
  const data = await request<unknown>(`/forms/${id}/submissions`);
  return assertObject<FormSubmissionsView>(data);
}

async function postEmpty(path: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), { method: "POST" });
  } catch {
    throw new ApiError("network");
  }
  if (!response.ok) {
    throw new ApiError(errorCodeFromStatus(response.status));
  }
}

export async function archiveForm(id: string): Promise<void> {
  await postEmpty(`/forms/${id}/archive`);
}

export async function restoreForm(id: string): Promise<void> {
  await postEmpty(`/forms/${id}/restore`);
}

export async function deleteForm(id: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/forms/${id}`), { method: "DELETE" });
  } catch {
    throw new ApiError("network");
  }
  if (!response.ok && response.status !== 204) {
    throw new ApiError(errorCodeFromStatus(response.status));
  }
}

export async function createForm(input: PublishFormRequest): Promise<PublishResult> {
  return postPublish("/forms", input);
}

export async function publishFormVersion(
  formId: string,
  input: PublishFormVersionRequest,
): Promise<PublishResult> {
  return postPublish(`/forms/${formId}/versions`, input);
}

export type SubmitResult =
  | { ok: true; submission: SubmissionSummary }
  | { ok: false; errors: ErrorResponse["errors"]; code?: "network" | "submit_failed" };

export async function submitForm(
  id: string,
  answers: Record<string, unknown>,
): Promise<SubmitResult> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/forms/${id}/submissions`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    });
  } catch {
    return { ok: false, errors: [], code: "network" };
  }

  if (response.status === 201) {
    const submission = await parseJSON<SubmissionSummary>(response);
    return { ok: true, submission };
  }

  if (response.status === 400) {
    const body = await parseJSON<ErrorResponse>(response);
    return { ok: false, errors: body.errors ?? [] };
  }

  return { ok: false, errors: [], code: "submit_failed" };
}
