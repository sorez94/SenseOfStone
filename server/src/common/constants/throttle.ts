/** Stricter limit for brute-force-sensitive endpoints (login, register, contact). */
export const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };
