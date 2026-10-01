import { AlertTriangle, PackageOpen } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-4 py-16 text-center", className)}>
      <div aria-hidden className="text-sage-deep">
        {icon ?? <PackageOpen className="size-14" strokeWidth={1.25} />}
      </div>
      <h2 className="text-xl text-neutral-800">{title}</h2>
      {description ? <p className="max-w-md text-sm text-neutral-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  className,
}: {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 px-4 py-16 text-center", className)}>
      <AlertTriangle aria-hidden className="size-12 text-red-500" strokeWidth={1.25} />
      <h2 className="text-xl text-neutral-800">{title}</h2>
      {description ? <p className="max-w-md text-sm text-neutral-500">{description}</p> : null}
      {onRetry && retryLabel ? (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function Alert({ tone = "info", children, className }: { tone?: "info" | "error" | "success"; children: ReactNode; className?: string }) {
  const styles = {
    info: "border-sage-line bg-sage-soft text-neutral-800",
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-green-200 bg-green-50 text-green-800",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-md border px-4 py-3 text-sm", styles[tone], className)}>
      {children}
    </div>
  );
}
