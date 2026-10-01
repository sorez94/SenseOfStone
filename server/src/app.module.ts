import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import configuration, { Configuration } from './config/configuration';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PreOrdersModule } from './modules/pre-orders/pre-orders.module';
import { ContactModule } from './modules/contact/contact.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Configuration, true>) => {
        const nodeEnv = configService.get('app.nodeEnv', { infer: true });
        const logLevel = configService.get('logLevel', { infer: true });
        return {
          pinoHttp: {
            level: logLevel,
            transport:
              nodeEnv === 'production'
                ? undefined
                : { target: 'pino-pretty', options: { singleLine: true } },
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Configuration, true>) => {
        const throttle = configService.get('throttle', { infer: true });
        return {
          throttlers: [{ ttl: throttle.ttlSeconds * 1000, limit: throttle.limit }],
        };
      },
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    CategoriesModule,
    ProductsModule,
    UploadsModule,
    PreOrdersModule,
    ContactModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
