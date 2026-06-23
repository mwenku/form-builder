import type {
  ErrorResponse,
  FormConfig,
  FormIntegrityView,
  FormSummary,
  PublishFormRequest,
  PublishFormVersionRequest,
  SubmissionSummary,
} from "@/generated/api-types";
import { ApiError, errorCodeFromStatus } from "@/lib/api-error";
import { apiUrl } from "./config";

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

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("network");
  }
  if (!response.ok) {
    throw new ApiError(errorCodeFromStatus(response.status));
  }
  return parseJSON<T>(response);
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

export async function fetchForms(): Promise<FormSummary[]> {
  const data = await request<unknown>("/forms");
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

export async function createForm(input: PublishFormRequest): Promise<FormConfig> {
  const data = await postJSON<unknown>("/forms", input);
  return assertObject<FormConfig>(data);
}

export async function publishFormVersion(
  formId: string,
  input: PublishFormVersionRequest,
): Promise<FormConfig> {
  const data = await postJSON<unknown>(`/forms/${formId}/versions`, input);
  return assertObject<FormConfig>(data);
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
