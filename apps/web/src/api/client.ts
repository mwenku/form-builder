import type {
  ErrorResponse,
  FormConfig,
  FormIntegrityView,
  FormSummary,
  SubmissionSummary,
} from "@/generated/api-types";
import { ApiError, errorCodeFromStatus } from "@/lib/api-error";
import { apiUrl } from "./config";

async function parseJSON<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
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

export async function fetchForms(): Promise<FormSummary[]> {
  return request<FormSummary[]>("/forms");
}

export async function fetchForm(id: string): Promise<FormConfig> {
  return request<FormConfig>(`/forms/${id}`);
}

export async function fetchIntegrity(id: string): Promise<FormIntegrityView> {
  return request<FormIntegrityView>(`/forms/${id}/integrity`);
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
