import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { RecoilRoot } from "recoil";
import { queryClient } from "@/api/query-client";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </RecoilRoot>
  );
}
