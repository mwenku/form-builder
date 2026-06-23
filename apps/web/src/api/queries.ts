import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createForm,
  fetchForm,
  fetchForms,
  fetchIntegrity,
  publishFormVersion,
  submitForm,
} from "@/api/client";
import type { PublishFormRequest, PublishFormVersionRequest } from "@/generated/api-types";
import { queryKeys } from "@/api/query-keys";

export function useFormsQuery() {
  return useQuery({
    queryKey: queryKeys.forms,
    queryFn: fetchForms,
  });
}

export function useFormQuery(formId: string) {
  return useQuery({
    queryKey: queryKeys.form(formId),
    queryFn: () => fetchForm(formId),
    enabled: Boolean(formId),
  });
}

export function useIntegrityQuery(formId: string) {
  return useQuery({
    queryKey: queryKeys.integrity(formId),
    queryFn: () => fetchIntegrity(formId),
    enabled: Boolean(formId),
  });
}

export function useSubmitFormMutation(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answers: Record<string, unknown>) => submitForm(formId, answers),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.integrity(formId) });
      }
    },
  });
}

export function useCreateFormMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PublishFormRequest) => createForm(input),
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms });
      queryClient.setQueryData(queryKeys.form(form.id), form);
    },
  });
}

export function usePublishFormVersionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, schema, uiSchema }: PublishFormVersionRequest & { formId: string }) =>
      publishFormVersion(formId, { schema, uiSchema }),
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms });
      queryClient.setQueryData(queryKeys.form(form.id), form);
      queryClient.invalidateQueries({ queryKey: queryKeys.integrity(form.id) });
    },
  });
}
