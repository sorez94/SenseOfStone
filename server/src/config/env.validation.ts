import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsString()
  @MinLength(1)
  API_PREFIX!: string;

  @IsString()
  @MinLength(1)
  CORS_ORIGINS!: string;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16, { message: 'JWT_ACCESS_SECRET must be at least 16 characters' })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_ACCESS_TTL!: string;

  @IsString()
  @MinLength(16, { message: 'JWT_REFRESH_SECRET must be at least 16 characters' })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_REFRESH_TTL!: string;

  @IsString()
  REFRESH_COOKIE_NAME!: string;

  @IsOptional()
  @IsString()
  COOKIE_DOMAIN?: string;

  @IsBooleanString()
  COOKIE_SECURE!: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  S3_ENDPOINT!: string;

  @IsString()
  S3_REGION!: string;

  @IsString()
  S3_BUCKET!: string;

  @IsString()
  S3_ACCESS_KEY_ID!: string;

  @IsString()
  S3_SECRET_ACCESS_KEY!: string;

  @IsBooleanString()
  S3_FORCE_PATH_STYLE!: string;

  @IsString()
  S3_PUBLIC_BASE_URL!: string;

  @IsInt()
  @Min(1)
  UPLOAD_MAX_SIZE_MB!: number;

  @IsInt()
  @Min(1)
  THROTTLE_TTL_SECONDS!: number;

  @IsInt()
  @Min(1)
  THROTTLE_LIMIT!: number;

  @IsIn(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
  LOG_LEVEL!: string;

  @IsString()
  SEED_ADMIN_EMAIL!: string;

  @IsString()
  SEED_ADMIN_PASSWORD!: string;

  @IsString()
  SEED_CUSTOMER_EMAIL!: string;

  @IsString()
  SEED_CUSTOMER_PASSWORD!: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const message = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return validatedConfig;
}
