import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { Errors } from 'src/common/exceptions/app.exception';
import { flattenValidationErrors } from 'src/common/utils/validation-error.util';

/**
 * Mirrors the production bootstrap in src/main.ts (minus listen/Swagger). The global
 * exception filter and response interceptor are registered as AppModule providers
 * (APP_FILTER/APP_INTERCEPTOR), so they're already active once AppModule is compiled -
 * only the parts main.ts applies imperatively (prefix, pipe, cookie parsing) need redoing here.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();

  app.use(cookieParser());
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      stopAtFirstError: false,
      exceptionFactory: (errors) => Errors.validation(flattenValidationErrors(errors)),
    }),
  );

  await app.init();
  return app;
}
