"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError } from "@/lib/api/errors";

/** Translates any thrown error into a user-facing message via its API error code. */
export function useApiErrorMessage() {
  const t = useTranslations("errors");
  return useCallback((error: unknown) => (isApiError(error) ? t(error.code) : t("INTERNAL_ERROR")), [t]);
}

/**
 * Maps API field errors (`error.details[].field`) onto react-hook-form fields.
 * Returns the general message to show above the form.
 */
export function useFormErrorHandler() {
  const tErrors = useTranslations("errors");
  const tValidation = useTranslations("validation");
  const message = useApiErrorMessage();

  return useCallback(
    <T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fieldMap: Record<string, Path<T>> = {}): string => {
      if (isApiError(error)) {
        for (const detail of error.details) {
          const field = fieldMap[detail.field] ?? (detail.field as Path<T>);
          const text =
            detail.code === "required"
              ? tValidation("required")
              : detail.code === "taken"
                ? tErrors(error.code)
                : detail.message;
          setError(field, { type: "server", message: text });
        }
      }
      return message(error);
    },
    [message, tErrors, tValidation],
  );
}
