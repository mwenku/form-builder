import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { reportError } from "@/lib/report-error";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      reportError(error, { source: "react-query", queryKey: query.queryKey });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      reportError(error, { source: "react-query-mutation" });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
      throwOnError: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
});
