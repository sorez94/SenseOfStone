export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_GOOGLE_TOKEN = 'INVALID_GOOGLE_TOKEN',
  FORBIDDEN = 'FORBIDDEN',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  EMAIL_TAKEN = 'EMAIL_TAKEN',
  SLUG_TAKEN = 'SLUG_TAKEN',
  CATEGORY_NOT_EMPTY = 'CATEGORY_NOT_EMPTY',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE',
  PRODUCT_NOT_PREORDERABLE = 'PRODUCT_NOT_PREORDERABLE',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/** Fallback mapping from a bare HTTP status to an error code, used when an
 * exception doesn't carry an explicit AppException code (e.g. framework-thrown
 * HttpExceptions such as the 404 from an unmatched route). */
export function errorCodeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.UNAUTHENTICATED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 413:
      return ErrorCode.PAYLOAD_TOO_LARGE;
    case 415:
      return ErrorCode.UNSUPPORTED_MEDIA_TYPE;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.RATE_LIMITED;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}
