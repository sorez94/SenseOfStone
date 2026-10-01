import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide the mobile label (e.g. for image or action cells). */
  hideLabelOnMobile?: boolean;
}

/**
 * Semantic table on desktop; on small screens each row becomes a card and each
 * cell shows its column header as a label (single markup, no duplicated views).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  busy,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  busy?: boolean;
}) {
  return (
    <div className="overflow-hidden md:rounded-xl md:border md:border-neutral-200 md:bg-white">
      <table className="w-full text-sm" aria-busy={busy || undefined}>
        <caption className="sr-only">{caption}</caption>
        <thead className="hidden bg-neutral-50 md:table-header-group">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cn("px-4 py-3 text-start text-xs font-medium tracking-wide text-neutral-500 uppercase", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn("block space-y-3 md:table-row-group md:space-y-0", busy && "opacity-60 transition-opacity")}>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="block rounded-xl border border-neutral-200 bg-white p-3 md:table-row md:rounded-none md:border-0 md:border-t md:p-0 md:hover:bg-neutral-50/70"
            >
              {columns.map((column) => (
                <td key={column.key} className={cn("flex items-center justify-between gap-3 px-1 py-1.5 md:table-cell md:px-4 md:py-3", column.className)}>
                  {column.hideLabelOnMobile ? null : <span className="text-xs text-neutral-500 md:hidden">{column.header}</span>}
                  <div className="min-w-0 text-end md:text-start">{column.cell(row)}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
