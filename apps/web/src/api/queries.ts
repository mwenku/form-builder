import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveForm,
  createForm,
  deleteForm,
  fetchForm,
  fetchForms,
  fetchIntegrity,
  fetchSubmissions,
  publishFormVersion,
  restoreForm,
  submitForm,
} from "@/api/client";
import type { PublishFormRequest, PublishFormVersionRequest } from "@/generated/api-types";
import { PublishError } from "@/lib/publish-error";
import { queryKeys } from "@/api/query-keys";

export function useFormsQuery(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.forms(includeArchived),
    queryFn: () => fetchForms(includeArchived),
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

export function useSubmissionsQuery(formId: string) {
  return useQuery({
    queryKey: queryKeys.submissions(formId),
    queryFn: () => fetchSubmissions(formId),
    enabled: Boolean(formId),
  });
}

function invalidateFormLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["forms"] });
}

export function useSubmitFormMutation(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answers: Record<string, unknown>) => submitForm(formId, answers),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.integrity(formId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.submissions(formId) });
        invalidateFormLists(queryClient);
      }
    },
  });
}

export function useCreateFormMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PublishFormRequest) => {
      const result = await createForm(input);
      if (!result.ok) {
        throw new PublishError(result.errors, result.code ?? "submit_failed");
      }
      return result.form;
    },
    onSuccess: (form) => {
      invalidateFormLists(queryClient);
      queryClient.setQueryData(queryKeys.form(form.id), form);
    },
  });
}

export function usePublishFormVersionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      formId,
      schema,
      uiSchema,
    }: PublishFormVersionRequest & { formId: string }) => {
      const result = await publishFormVersion(formId, { schema, uiSchema });
      if (!result.ok) {
        throw new PublishError(result.errors, result.code ?? "submit_failed");
      }
      return result.form;
    },
    onSuccess: (form) => {
      invalidateFormLists(queryClient);
      queryClient.setQueryData(queryKeys.form(form.id), form);
      queryClient.invalidateQueries({ queryKey: queryKeys.integrity(form.id) });
    },
  });
}

export function useArchiveFormMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveForm,
    onSuccess: () => invalidateFormLists(queryClient),
  });
}

export function useRestoreFormMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreForm,
    onSuccess: () => invalidateFormLists(queryClient),
  });
}

export function useDeleteFormMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteForm,
    onSuccess: () => invalidateFormLists(queryClient),
  });
}
