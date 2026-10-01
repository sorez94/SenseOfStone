"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";

/** Shared body for `error.tsx` boundaries. */
export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorState title={t("errorTitle")} description={t("errorDescription")} retryLabel={t("retry")} onRetry={reset} />;
}
