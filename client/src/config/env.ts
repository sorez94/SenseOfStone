/** Typed access to public runtime configuration. See `.env.example`. */
export type ApiMode = "mock" | "http";

const apiMode: ApiMode = process.env.NEXT_PUBLIC_API_MODE === "http" ? "http" : "mock";

export const env = {
  apiMode,
  /** Base URL of the backend API. In mock mode this is the built-in fake backend. */
  apiBaseUrl: apiMode === "http" ? (process.env.NEXT_PUBLIC_API_BASE_URL ?? "") : "/api/v1",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
