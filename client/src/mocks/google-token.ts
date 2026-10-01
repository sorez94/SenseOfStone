/**
 * Mock Google ID tokens. The real Google Identity Services returns a signed JWT
 * that the real backend must verify (audience = client ID, issuer = accounts.google.com).
 * In mock mode we produce an unsigned token with the same claim names.
 */
export interface GoogleClaims {
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

const PREFIX = "mockgoogle.";

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function encodeMockGoogleToken(claims: GoogleClaims): string {
  return PREFIX + toBase64Url(JSON.stringify({ iss: "mock-google", ...claims }));
}

export function decodeMockGoogleToken(token: string): GoogleClaims | null {
  if (!token.startsWith(PREFIX)) return null;
  try {
    const claims = JSON.parse(fromBase64Url(token.slice(PREFIX.length))) as Partial<GoogleClaims>;
    return typeof claims.email === "string" && claims.email.includes("@") ? (claims as GoogleClaims) : null;
  } catch {
    return null;
  }
}
