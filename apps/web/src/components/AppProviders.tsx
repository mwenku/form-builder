import { QueryClientProvider, QueryErrorResetBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { RecoilRoot } from "recoil";
import { queryClient } from "@/api/query-client";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset }) => <ErrorBoundary onReset={reset}>{children}</ErrorBoundary>}
        </QueryErrorResetBoundary>
      </QueryClientProvider>
    </RecoilRoot>
  );
}
