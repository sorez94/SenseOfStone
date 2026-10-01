import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { MulterError } from 'multer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AppException, ErrorBody } from '../exceptions/app.exception';
import { ErrorCode, errorCodeForStatus } from '../constants/error-code.enum';
import type { Configuration } from '../../config/configuration';

/**
 * Single place that turns every thrown error - ours (AppException), Nest's
 * built-ins (guards, unmatched routes), multer, or truly unexpected bugs -
 * into the `{ error: { code, message, details } }` envelope from
 * docs/API.md §1.6, with the exact HTTP status/code pairs the contract lists.
 */
@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly configService: ConfigService<Configuration, true>,
    @InjectPinoLogger(AllExceptionsFilter.name) private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const { status, body } = this.resolve(exception, response);

    if (status >= 500) {
      this.logger.error({ err: exception }, body.message);
    }

    response.status(status).json({ error: body });
  }

  private resolve(
    exception: unknown,
    response: Response,
  ): { status: number; body: ErrorBody } {
    if (exception instanceof AppException) {
      const status = exception.getStatus();
      const payload = exception.getResponse() as ErrorBody;
      return { status, body: payload };
    }

    if (exception instanceof ThrottlerException) {
      const ttl = this.configService.get('throttle.ttlSeconds', { infer: true });
      response.setHeader('Retry-After', String(ttl));
      return {
        status: 429,
        body: { code: ErrorCode.RATE_LIMITED, message: 'Too many requests, please try again later' },
      };
    }

    if (exception instanceof MulterError && exception.code === 'LIMIT_FILE_SIZE') {
      return {
        status: 413,
        body: {
          code: ErrorCode.PAYLOAD_TOO_LARGE,
          message: 'Upload exceeds the maximum allowed size',
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const rawResponse = exception.getResponse();
      const message =
        typeof rawResponse === 'string'
          ? rawResponse
          : ((rawResponse as { message?: string | string[] })?.message ?? exception.message);
      return {
        status,
        body: {
          code: errorCodeForStatus(status),
          message: Array.isArray(message) ? message.join(', ') : message,
        },
      };
    }

    if (this.isBodyParserSyntaxError(exception)) {
      return {
        status: 400,
        body: { code: ErrorCode.VALIDATION_ERROR, message: 'Request body is not valid JSON' },
      };
    }

    return {
      status: 500,
      body: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
    };
  }

  private isBodyParserSyntaxError(exception: unknown): boolean {
    return (
      exception instanceof SyntaxError &&
      'status' in exception &&
      (exception as { status?: number }).status === 400 &&
      'body' in exception
    );
  }
}
