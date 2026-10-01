import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

/** SOS style: sage buttons that turn leaf-green with white text on hover, with a subtle scale. */
const variants: Record<ButtonVariant, string> = {
  primary: "bg-sage text-neutral-900 hover:bg-leaf-dark hover:text-white",
  dark: "bg-ink text-white hover:bg-neutral-800",
  outline: "border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-900 hover:bg-neutral-50",
  ghost: "text-neutral-700 hover:bg-neutral-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
  icon: "h-10 w-10 p-0",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap",
    "transition-all duration-200 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading = false, icon, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
});
