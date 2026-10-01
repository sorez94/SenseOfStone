import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

interface PaginationLabels {
  nav: string;
  previous: string;
  next: string;
  pageOf: string;
}

type PaginationProps = {
  page: number;
  totalPages: number;
  labels: PaginationLabels;
  className?: string;
} & ({ hrefFor: (page: number) => string; onChange?: never } | { onChange: (page: number) => void; hrefFor?: never });

const itemStyle =
  "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-md border border-neutral-200 px-3 text-sm transition-colors hover:border-neutral-900";

/** Works as links (server-rendered storefront) or buttons (client admin tables). */
export function Pagination({ page, totalPages, labels, className, hrefFor, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const control = (target: number, disabled: boolean, label: string, icon: React.ReactNode) => {
    const content = (
      <>
        <span className="rtl:rotate-180">{icon}</span>
        <span className="hidden sm:inline">{label}</span>
      </>
    );
    if (disabled) {
      return (
        <span aria-disabled className={cn(itemStyle, "pointer-events-none opacity-40")}>
          {content}
        </span>
      );
    }
    return hrefFor ? (
      <Link href={hrefFor(target)} className={itemStyle} aria-label={label} scroll>
        {content}
      </Link>
    ) : (
      <button type="button" className={itemStyle} onClick={() => onChange?.(target)} aria-label={label}>
        {content}
      </button>
    );
  };

  return (
    <nav aria-label={labels.nav} className={cn("mt-10 flex items-center justify-center gap-3", className)}>
      {control(page - 1, page <= 1, labels.previous, <ChevronLeft className="size-4" aria-hidden />)}
      <span className="px-2 text-sm text-neutral-600" aria-current="page">
        {labels.pageOf}
      </span>
      {control(page + 1, page >= totalPages, labels.next, <ChevronRight className="size-4" aria-hidden />)}
    </nav>
  );
}
