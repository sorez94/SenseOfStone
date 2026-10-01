import type { ReactNode } from "react";

export function AdminPageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl text-neutral-900">{title}</h1>
        {description ? <div className="mt-1 text-sm text-neutral-500">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminCard({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-neutral-200 bg-white p-5 ${className ?? ""}`}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base text-neutral-900">{title}</h2>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
