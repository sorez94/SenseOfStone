// Read directly from process.env (not ConfigService): Multer's `limits` must be set at decoration
// time, before Nest's DI container (and ConfigService) exists. main.ts loads `dotenv/config`
// before anything else, so this is already populated by the time this module is imported.
export const MAX_UPLOAD_SIZE_BYTES = parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? '5', 10) * 1024 * 1024;
