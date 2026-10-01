import { ValidationError } from 'class-validator';
import { ErrorDetail } from '../exceptions/app.exception';

/**
 * Flattens class-validator's recursive ValidationError tree into the flat
 * `{ field, code, message }[]` shape docs/API.md §1.6 expects, with `field`
 * being a dot path into the request body (e.g. `items.0.quantity`).
 */
export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ErrorDetail[] {
  const details: ErrorDetail[] = [];

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      for (const [constraintKey, message] of Object.entries(error.constraints)) {
        details.push({ field: path, code: constraintKey, message });
      }
    }

    if (error.children && error.children.length > 0) {
      details.push(...flattenValidationErrors(error.children, path));
    }
  }

  return details;
}
