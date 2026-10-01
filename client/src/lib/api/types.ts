import type { PaginationMeta } from "@/domain";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

/** A transport-agnostic API request. `path` is relative to the API base, e.g. "/products". */
export interface ApiRequest {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/** Raw response returned by a transport before envelope parsing. */
export interface TransportResponse {
  status: number;
  body: unknown;
}

/**
 * Moves an ApiRequest to a backend and returns the raw response.
 * Implementations: HTTP (fetch) and in-process (mock backend on the server).
 */
export interface ApiTransport {
  send(request: ApiRequest): Promise<TransportResponse>;
}

/** Wire format of successful responses (see docs/API.md §1). */
export interface SuccessEnvelope<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFieldError {
  field: string;
  code: string;
  message: string;
}

/** Wire format of error responses (see docs/API.md §1). */
export interface ErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiFieldError[];
  };
}

export const apiErrorCodes = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "INVALID_CREDENTIALS",
  "INVALID_GOOGLE_TOKEN",
  "FORBIDDEN",
  "PROFILE_INCOMPLETE",
  "NOT_FOUND",
  "CONFLICT",
  "EMAIL_TAKEN",
  "SLUG_TAKEN",
  "CATEGORY_NOT_EMPTY",
  "PRODUCT_NOT_PREORDERABLE",
  "INVALID_STATUS_TRANSITION",
  "PAYLOAD_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "NETWORK_ERROR",
] as const;
export type ApiErrorCode = (typeof apiErrorCodes)[number];
