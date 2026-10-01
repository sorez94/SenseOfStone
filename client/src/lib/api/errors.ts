import { apiErrorCodes, type ApiErrorCode, type ApiFieldError } from "./types";

/** Error thrown by ApiClient for any non-2xx response or network failure. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: ApiFieldError[];

  constructor(status: number, code: ApiErrorCode, message: string, details: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static network(cause?: unknown): ApiError {
    const error = new ApiError(0, "NETWORK_ERROR", "Network request failed");
    error.cause = cause;
    return error;
  }

  /** Builds an ApiError from any response body, tolerating malformed payloads. */
  static fromResponse(status: number, body: unknown): ApiError {
    const payload = (body as { error?: { code?: unknown; message?: unknown; details?: unknown } } | null)?.error;
    const code = isApiErrorCode(payload?.code) ? payload.code : fallbackCode(status);
    const message = typeof payload?.message === "string" ? payload.message : `Request failed with status ${status}`;
    const details = Array.isArray(payload?.details) ? (payload.details as ApiFieldError[]) : [];
    return new ApiError(status, code, message, details);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && (apiErrorCodes as readonly string[]).includes(value);
}

function fallbackCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
    case 422:
      return "VALIDATION_ERROR";
    case 401:
      return "UNAUTHENTICATED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 413:
      return "PAYLOAD_TOO_LARGE";
    case 429:
      return "RATE_LIMITED";
    default:
      return "INTERNAL_ERROR";
  }
}
