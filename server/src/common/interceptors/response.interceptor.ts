import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResult } from '../dto/paginated-result';

/**
 * Wraps every controller return value into the envelope docs/API.md §1.4 requires:
 * - PaginatedResult -> { data: items, meta: { page, pageSize, total, totalPages } }
 * - anything else   -> { data: value }
 * - 204 responses / undefined -> no body (Nest calls response.end() for nil values)
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((result: unknown) => {
        if (response.statusCode === 204 || result === undefined) {
          return undefined;
        }

        if (result instanceof PaginatedResult) {
          const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
          return {
            data: result.items,
            meta: {
              page: result.page,
              pageSize: result.pageSize,
              total: result.total,
              totalPages,
            },
          };
        }

        return { data: result };
      }),
    );
  }
}
