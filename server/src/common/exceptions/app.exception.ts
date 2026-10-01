import { HttpException } from '@nestjs/common';
import { ErrorCode } from '../constants/error-code.enum';

export interface ErrorDetail {
  field: string;
  code: string;
  message: string;
}

export interface ErrorBody {
  code: ErrorCode;
  message: string;
  details?: ErrorDetail[];
}

/**
 * Every deliberately-thrown error in the app is an AppException so the global
 * filter can serialize it into the `{ error: { code, message, details } }`
 * envelope the frontend contract (docs/API.md §1.6) expects verbatim.
 */
export class AppException extends HttpException {
  constructor(status: number, code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super({ code, message, details }, status);
  }
}

/** Factory helpers for the exact error codes/status pairs defined in docs/API.md §1.6. */
export const Errors = {
  validation: (details: ErrorDetail[], message = 'Request validation failed') =>
    new AppException(422, ErrorCode.VALIDATION_ERROR, message, details),

  malformedJson: () =>
    new AppException(400, ErrorCode.VALIDATION_ERROR, 'Request body is not valid JSON'),

  unauthenticated: (message = 'Authentication required') =>
    new AppException(401, ErrorCode.UNAUTHENTICATED, message),

  invalidCredentials: () =>
    new AppException(401, ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password'),

  invalidGoogleToken: (message = 'The provided Google ID token could not be verified') =>
    new AppException(401, ErrorCode.INVALID_GOOGLE_TOKEN, message),

  forbidden: (message = 'You do not have permission to perform this action') =>
    new AppException(403, ErrorCode.FORBIDDEN, message),

  profileIncomplete: () =>
    new AppException(
      403,
      ErrorCode.PROFILE_INCOMPLETE,
      'Please complete your profile before continuing',
    ),

  notFound: (message = 'Resource not found') => new AppException(404, ErrorCode.NOT_FOUND, message),

  conflict: (message: string, details?: ErrorDetail[]) =>
    new AppException(409, ErrorCode.CONFLICT, message, details),

  emailTaken: () =>
    new AppException(409, ErrorCode.EMAIL_TAKEN, 'Email is already registered', [
      { field: 'email', code: 'taken', message: 'Email is already registered' },
    ]),

  slugTaken: (field = 'slug') =>
    new AppException(409, ErrorCode.SLUG_TAKEN, 'Slug is already in use', [
      { field, code: 'taken', message: 'Slug is already in use' },
    ]),

  categoryNotEmpty: () =>
    new AppException(
      409,
      ErrorCode.CATEGORY_NOT_EMPTY,
      'Category still has products assigned to it',
    ),

  invalidStatusTransition: (message = 'This status transition is not allowed') =>
    new AppException(409, ErrorCode.INVALID_STATUS_TRANSITION, message),

  payloadTooLarge: (message = 'Upload exceeds the maximum allowed size') =>
    new AppException(413, ErrorCode.PAYLOAD_TOO_LARGE, message),

  unsupportedMediaType: (message = 'Unsupported file type') =>
    new AppException(415, ErrorCode.UNSUPPORTED_MEDIA_TYPE, message),

  productNotPreorderable: (field: string) =>
    new AppException(422, ErrorCode.PRODUCT_NOT_PREORDERABLE, 'Product cannot be pre-ordered', [
      { field, code: 'not_preorderable', message: 'Product cannot be pre-ordered' },
    ]),

  rateLimited: (message = 'Too many requests, please try again later') =>
    new AppException(429, ErrorCode.RATE_LIMITED, message),

  internal: (message = 'An unexpected error occurred') =>
    new AppException(500, ErrorCode.INTERNAL_ERROR, message),
};
