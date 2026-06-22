import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchForm, fetchForms, fetchIntegrity, submitForm } from "@/api/client";
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
