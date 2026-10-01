import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <>
      <LoaderCircle aria-hidden className={cn("size-5 animate-spin", className)} />
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}

/** Centered spinner for full sections/pages. */
export function LoadingBlock({ label, className }: { label: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex min-h-[30vh] items-center justify-center text-neutral-500", className)}>
      <Spinner className="size-7" label={label} />
    </div>
  );
}
