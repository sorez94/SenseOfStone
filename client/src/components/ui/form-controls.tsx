import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * SOS form style: underline-only inputs that darken on focus.
 * `boxed` variant is used in dense admin forms and filter bars.
 */
type Appearance = "underline" | "boxed";

const base = "w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:outline-none disabled:opacity-60 aria-[invalid=true]:border-red-500";
const appearances: Record<Appearance, string> = {
  underline: "border-0 border-b border-neutral-400 py-2 focus:border-neutral-900",
  boxed: "rounded-md border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900",
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  appearance?: Appearance;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ appearance = "underline", className, ...props }, ref) {
  return <input ref={ref} className={cn(base, appearances[appearance], "h-10", className)} {...props} />;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  appearance?: Appearance;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { appearance = "underline", className, rows = 4, ...props },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(base, appearances[appearance], "resize-y", className)} {...props} />;
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  appearance?: Appearance;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ appearance = "boxed", className, ...props }, ref) {
  return <select ref={ref} className={cn(base, appearances[appearance], "h-10 cursor-pointer pe-8", className)} {...props} />;
});

export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }>(function Checkbox(
  { label, className, id, ...props },
  ref,
) {
  return (
    <label htmlFor={id} className={cn("inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-800", className)}>
      <input ref={ref} id={id} type="checkbox" className="size-4 cursor-pointer rounded border-neutral-400 accent-leaf-dark" {...props} />
      {label}
    </label>
  );
});
