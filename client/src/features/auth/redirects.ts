import type { User } from "@/domain";

/**
 * Only allow same-site relative paths as post-login destinations (prevents open redirects).
 * Paths are locale-less (e.g. "/products/luna"); the locale-aware router adds the prefix.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  return raw;
}

export function withNext(path: string, next: string | null | undefined): string {
  const safe = safeNextPath(next);
  return safe ? `${path}?next=${encodeURIComponent(safe)}` : path;
}

/** Where to send a user after they authenticate. */
export function resolvePostAuthPath(user: Pick<User, "isProfileComplete" | "role">, next: string | null | undefined): string {
  if (!user.isProfileComplete) return withNext("/complete-profile", next);
  return safeNextPath(next) ?? (user.role === "admin" ? "/admin" : "/");
}
