import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import type { Configuration } from './config/configuration';
import { Errors } from './common/exceptions/app.exception';
import { flattenValidationErrors } from './common/utils/validation-error.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  // Behind a single reverse proxy (nginx): use X-Forwarded-For so rate limiting is per client.
  app.set('trust proxy', 1);

  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService<Configuration, true>);
  const appConfig = configService.get('app', { infer: true });

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: appConfig.corsOrigins.length > 0 ? appConfig.corsOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept-Language'],
    credentials: true,
  });

  app.setGlobalPrefix(appConfig.apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      stopAtFirstError: false,
      exceptionFactory: (errors) => Errors.validation(flattenValidationErrors(errors)),
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sense Of Stone API')
    .setDescription('Backend API for the Sense Of Stone product showcase / pre-order platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(appConfig.port, '0.0.0.0');
}

void bootstrap();
