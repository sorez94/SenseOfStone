import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { ACCESS_TOKEN_COOKIE } from "./lib/api/token-storage";

const intlProxy = createMiddleware(routing);

/** Locale-less path prefixes that require a signed-in user. */
const PROTECTED_PREFIXES = ["/account", "/admin", "/complete-profile"];

/**
 * 1. Optimistic auth check: redirect to /login when there is no session cookie.
 *    (Real validation happens in the API and in <RequireAuth>.)
 * 2. Locale negotiation / prefixing via next-intl.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const match = pathname.match(new RegExp(`^/(${routing.locales.join("|")})(/.*)?$`));

  if (match) {
    const locale = match[1]!;
    const rest = match[2] ?? "/";
    const isProtected = PROTECTED_PREFIXES.some((prefix) => rest === prefix || rest.startsWith(`${prefix}/`));
    if (isProtected && !request.cookies.has(ACCESS_TOKEN_COOKIE)) {
      const url = new URL(`/${locale}/login`, request.url);
      url.searchParams.set("next", `${rest}${search}`);
      return NextResponse.redirect(url);
    }
  }

  return intlProxy(request);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
