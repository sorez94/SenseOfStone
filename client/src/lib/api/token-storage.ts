/**
 * Access-token persistence in the browser.
 *
 * The token lives in a first-party cookie so that `src/proxy.ts` can do an optimistic
 * redirect for protected routes before any JS runs; it is sent to the API as a Bearer token.
 * See docs/ARCHITECTURE.md ("Session storage") for the httpOnly-cookie upgrade path.
 */
export const ACCESS_TOKEN_COOKIE = "sos_at";

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const tokenStorage = {
  get(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.split("; ").find((part) => part.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
    return match ? decodeURIComponent(match.slice(ACCESS_TOKEN_COOKIE.length + 1)) : null;
  },

  set(token: string, expiresAt: string): void {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Expires=${new Date(expiresAt).toUTCString()}; SameSite=Lax${secure}`;
    notify();
  },

  clear(): void {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    notify();
  },

  /** For useSyncExternalStore. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
