/**
 * Marker return type for list endpoints. ResponseInterceptor recognises this
 * (via `instanceof`) and serializes it into the `{ data, meta }` envelope
 * from docs/API.md §1.4; everything else is wrapped as `{ data: value }`.
 */
export class PaginatedResult<T> {
  constructor(
    public readonly items: T[],
    public readonly page: number,
    public readonly pageSize: number,
    public readonly total: number,
  ) {}
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export function clampPagination(
  query: PaginationQuery,
  defaultPageSize: number,
  maxPageSize = 100,
): { page: number; pageSize: number; skip: number } {
  const pageSize = Math.min(
    Math.max(1, Number(query.pageSize) || defaultPageSize),
    maxPageSize,
  );
  const page = Math.max(1, Number(query.page) || 1);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

/** If `page` overshoots `totalPages`, docs/API.md §1.5 says to return the last page instead. */
export function resolveOvershootPage(page: number, pageSize: number, total: number): number {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(page, totalPages);
}
