import type { z } from "zod";
import type { Paginated } from "@/domain";
import type { ApiErrorCode, ApiFieldError, HttpMethod, TransportResponse } from "@/lib/api/types";
import type { MockDatabase, StoredUser } from "../db/types";

export interface MockRequest {
  method: HttpMethod;
  path: string;
  query: URLSearchParams;
  /** Parsed JSON, a FormData instance, or undefined. */
  body: unknown;
  headers: Record<string, string>;
}

/** Binary responses (uploaded files) bypass the JSON envelope. */
export interface MockResponse extends TransportResponse {
  raw?: { bytes: Uint8Array; contentType: string };
}

export interface HandlerContext {
  req: MockRequest;
  params: Record<string, string>;
  db: MockDatabase;
  /** Accept-Language, used for locale-dependent sorting. */
  locale: "en" | "fa";
  auth: {
    user: () => StoredUser | null;
    require: () => StoredUser;
    requireAdmin: () => StoredUser;
    token: () => string | null;
  };
}

export type Handler = (ctx: HandlerContext) => MockResponse | Promise<MockResponse>;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details: ApiFieldError[] = [],
  ) {
    super(message);
  }
}

export const ok = <T>(data: T, status = 200): MockResponse => ({ status, body: { data } });
export const created = <T>(data: T): MockResponse => ok(data, 201);
export const noContent = (): MockResponse => ({ status: 204, body: null });
export const paged = <T>(page: Paginated<T>): MockResponse => ({ status: 200, body: { data: page.items, meta: page.meta } });

export function errorResponse(error: HttpError): MockResponse {
  return {
    status: error.status,
    body: { error: { code: error.code, message: error.message, ...(error.details.length ? { details: error.details } : {}) } },
  };
}

export const notFound = (what: string) => new HttpError(404, "NOT_FOUND", `${what} not found`);

/** Validates a request body with zod, producing the documented 422 error shape. */
export function parseBody<S extends z.ZodType>(schema: S, body: unknown): z.infer<S> {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  throw new HttpError(
    422,
    "VALIDATION_ERROR",
    "Request validation failed",
    result.error.issues.map((issue) => ({ field: issue.path.join("."), code: issue.code, message: issue.message })),
  );
}

export function paginate<T>(items: T[], query: URLSearchParams, defaultPageSize = 12): Paginated<T> {
  const pageSize = clampInt(query.get("pageSize"), defaultPageSize, 1, 100);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(clampInt(query.get("page"), 1, 1, Number.MAX_SAFE_INTEGER), totalPages);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), meta: { page, pageSize, total, totalPages } };
}

export function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = raw == null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function optionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
