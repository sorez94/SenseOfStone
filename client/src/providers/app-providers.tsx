"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { SessionProvider, sessionQueryKey } from "@/features/auth/session";
import { getDirection } from "@/i18n/config";
import { isApiError } from "@/lib/api/errors";
import { createBrowserServices } from "@/lib/api/browser";
import { tokenStorage } from "@/lib/api/token-storage";
import { ServicesContext } from "./services-context";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Don't retry client errors (4xx); retry transient failures once.
        retry: (count, error) => !(isApiError(error) && error.status >= 400 && error.status < 500) && count < 1,
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const [queryClient] = useState(createQueryClient);
  const [services] = useState(() =>
    createBrowserServices({
      // <html lang> always reflects the active locale, even after client-side locale switches.
      getLocale: () => document.documentElement.lang,
      onUnauthenticated: () => {
        tokenStorage.clear();
        queryClient.setQueryData(sessionQueryKey, null);
      },
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ServicesContext.Provider value={services}>
        <SessionProvider>{children}</SessionProvider>
      </ServicesContext.Provider>
      <Toaster position="top-center" richColors closeButton dir={getDirection(locale)} />
    </QueryClientProvider>
  );
}
