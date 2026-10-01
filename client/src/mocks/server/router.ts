import type { HttpMethod } from "@/lib/api/types";
import { getDb } from "../db/store";
import type { StoredUser } from "../db/types";
import { errorResponse, type Handler, type HandlerContext, HttpError, type MockRequest, type MockResponse } from "./http";
import { adminCategoryRoutes } from "./handlers/admin-categories";
import { adminPreOrderRoutes } from "./handlers/admin-pre-orders";
import { adminProductRoutes } from "./handlers/admin-products";
import { adminRoutes } from "./handlers/admin";
import { authRoutes } from "./handlers/auth";
import { catalogRoutes } from "./handlers/catalog";
import { contactRoutes } from "./handlers/contact";
import { preOrderRoutes } from "./handlers/pre-orders";
import { profileRoutes } from "./handlers/profile";
import { uploadRoutes } from "./handlers/uploads";

export type RouteDefinition = [method: HttpMethod, pattern: string, handler: Handler];

interface CompiledRoute {
  method: HttpMethod;
  regex: RegExp;
  keys: string[];
  handler: Handler;
}

function compile([method, pattern, handler]: RouteDefinition): CompiledRoute {
  const keys: string[] = [];
  const source = pattern.replace(/:([a-zA-Z]+)/g, (_, key: string) => {
    keys.push(key);
    return "([^/]+)";
  });
  return { method, regex: new RegExp(`^${source}/?$`), keys, handler };
}

// Order matters: static segments (e.g. /products/slug/:slug) before params.
const routes: CompiledRoute[] = [
  ...authRoutes,
  ...profileRoutes,
  ...catalogRoutes,
  ...contactRoutes,
  ...preOrderRoutes,
  ...adminRoutes,
  ...adminProductRoutes,
  ...adminCategoryRoutes,
  ...adminPreOrderRoutes,
  ...uploadRoutes,
].map(compile);

function createAuth(req: MockRequest): HandlerContext["auth"] {
  const db = getDb();
  const token = () => {
    const header = req.headers.authorization ?? req.headers.Authorization;
    return header?.startsWith("Bearer ") ? header.slice(7) : null;
  };
  const user = (): StoredUser | null => {
    const value = token();
    if (!value) return null;
    const session = db.sessions.get(value);
    if (!session || new Date(session.expiresAt) < new Date()) return null;
    return db.users.find((u) => u.id === session.userId) ?? null;
  };
  const require = () => {
    const current = user();
    if (!current) throw new HttpError(401, "UNAUTHENTICATED", "Authentication required");
    return current;
  };
  const requireAdmin = () => {
    const current = require();
    if (current.role !== "admin") throw new HttpError(403, "FORBIDDEN", "Admin role required");
    return current;
  };
  return { token, user, require, requireAdmin };
}

/** Dispatches a request to the fake backend. Never throws; errors become error envelopes. */
export async function dispatch(req: MockRequest): Promise<MockResponse> {
  const path = req.path.split("?")[0] ?? "/";
  let methodMismatch = false;

  for (const route of routes) {
    const match = route.regex.exec(path);
    if (!match) continue;
    if (route.method !== req.method) {
      methodMismatch = true;
      continue;
    }
    const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(match[i + 1] ?? "")]));
    const acceptLanguage = req.headers["accept-language"] ?? req.headers["Accept-Language"] ?? "";
    const ctx: HandlerContext = {
      req,
      params,
      db: getDb(),
      locale: acceptLanguage.startsWith("fa") ? "fa" : "en",
      auth: createAuth(req),
    };
    try {
      return await route.handler(ctx);
    } catch (error) {
      if (error instanceof HttpError) return errorResponse(error);
      console.error("[mock-api] unhandled error", error);
      return errorResponse(new HttpError(500, "INTERNAL_ERROR", "Unexpected server error"));
    }
  }

  return errorResponse(
    methodMismatch
      ? new HttpError(405, "NOT_FOUND", `Method ${req.method} not allowed for ${path}`)
      : new HttpError(404, "NOT_FOUND", `No route for ${req.method} ${path}`),
  );
}
