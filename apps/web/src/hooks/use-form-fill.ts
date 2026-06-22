import { FormEvent } from "react";
import { useRecoilState } from "recoil";
import { useFormQuery, useSubmitFormMutation } from "@/api/queries";
import type { FormConfig } from "@/generated/api-types";
import type { UISchema } from "@/lib/schema";
import { getFieldLabel } from "@/lib/schema";
import { userMessagesStatic } from "@/lib/user-messages";
import { friendlyValidationMessage } from "@/lib/validation-messages";
import { formFillUiState } from "@/state/form-fill";

export function useFormFill(formId: string) {
  const [ui, setUi] = useRecoilState(formFillUiState(formId));
  const formQuery = useFormQuery(formId);
  const submitMutation = useSubmitFormMutation(formId);

  function setFieldValue(field: string, value: unknown) {
    setUi((previous) => ({
      ...previous,
      values: { ...previous.values, [field]: value },
      submitted: false,
    }));
  }

  async function handleSubmit(event: FormEvent, form: FormConfig) {
    event.preventDefault();
    setUi((previous) => ({
      ...previous,
      fieldErrors: {},
      submitErrorCode: null,
      submitted: false,
    }));

    let result;
    try {
      result = await submitMutation.mutateAsync(ui.values);
    } catch {
      setUi((previous) => ({
        ...previous,
        submitErrorCode: "submit_failed",
      }));
      return;
    }

    if (result.ok) {
      setUi({
        values: {},
        fieldErrors: {},
        submitted: true,
        submitErrorCode: null,
      });
      return;
    }

    if (result.code) {
      setUi((previous) => ({
        ...previous,
        submitErrorCode: result.code ?? null,
      }));
      return;
    }

    const uiSchema = form.uiSchema as UISchema;
    const nextErrors: Record<string, string> = {};
    for (const item of result.errors) {
      const key = item.field || "_form";
      const label = item.field ? getFieldLabel(item.field, uiSchema) : "Form";
      nextErrors[key] = friendlyValidationMessage(item.field, item.message, label);
    }
    if (Object.keys(nextErrors).length > 0 && !nextErrors._form) {
      nextErrors._form = userMessagesStatic.validationSummary;
    }

    setUi((previous) => ({
      ...previous,
      fieldErrors: nextErrors,
    }));
  }

  return {
    ui,
    formQuery,
    submitMutation,
    setFieldValue,
    handleSubmit,
    retryLoad: () => formQuery.refetch(),
  };
}
