import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface FormFieldProps {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  optionalLabel?: string;
  /** SOS style uppercase tracked labels (storefront); admin forms use normal labels. */
  labelStyle?: "caps" | "normal";
  className?: string;
  children: ReactElement<Record<string, unknown>>;
}

/**
 * Wires label, hint and error to a single control via id / aria-describedby / aria-invalid.
 */
export function FormField({ id, label, error, hint, required, optionalLabel, labelStyle = "caps", className, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })
    : children;

  return (
    <div className={cn("flex flex-col", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 text-neutral-700",
          labelStyle === "caps" ? "text-xs font-semibold tracking-wide uppercase" : "text-sm font-medium",
        )}
      >
        {label}
        {required ? <span aria-hidden className="ms-0.5 text-red-600">*</span> : null}
        {!required && optionalLabel ? <span className="ms-1 text-xs font-normal normal-case text-neutral-400">({optionalLabel})</span> : null}
      </label>
      {control}
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
