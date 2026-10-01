export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
}

export interface JwtConfig {
  accessSecret: string;
  accessTtl: string;
  refreshSecret: string;
  refreshTtl: string;
  refreshCookieName: string;
  cookieDomain?: string;
  cookieSecure: boolean;
}

export interface GoogleConfig {
  clientId?: string;
}

export interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  publicBaseUrl: string;
}

export interface LocalStorageConfig {
  /** Root directory files are written to. May be relative (resolved against process.cwd())
   *  or absolute - on either OS. Never hardcode this; it only ever comes from env. */
  root: string;
  /** Base URL files are served from (this process serves them statically from `root`). */
  publicBaseUrl: string;
}

export interface UploadsConfig {
  driver: 'local' | 's3';
  maxUploadSizeBytes: number;
}

export interface ThrottleConfig {
  ttlSeconds: number;
  limit: number;
}

export interface SeedConfig {
  adminEmail: string;
  adminPassword: string;
  customerEmail: string;
  customerPassword: string;
}

export interface Configuration {
  app: AppConfig;
  jwt: JwtConfig;
  google: GoogleConfig;
  uploads: UploadsConfig;
  s3: S3Config;
  localStorage: LocalStorageConfig;
  throttle: ThrottleConfig;
  logLevel: string;
  seed: SeedConfig;
}

export default (): Configuration => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'v1',
    corsOrigins: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
    refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'sos_rt',
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || undefined,
  },
  uploads: {
    driver: process.env.STORAGE_DRIVER === 's3' ? 's3' : 'local',
    maxUploadSizeBytes: parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? '5', 10) * 1024 * 1024,
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? '',
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? '',
  },
  localStorage: {
    root: process.env.LOCAL_STORAGE_ROOT ?? './storage/uploads',
    publicBaseUrl: process.env.LOCAL_STORAGE_PUBLIC_URL ?? 'http://localhost:4000/uploads',
  },
  throttle: {
    ttlSeconds: parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '20', 10),
  },
  logLevel: process.env.LOG_LEVEL ?? 'info',
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@senseofstone.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'admin1234',
    customerEmail: process.env.SEED_CUSTOMER_EMAIL ?? 'customer@example.com',
    customerPassword: process.env.SEED_CUSTOMER_PASSWORD ?? 'customer1234',
  },
});
