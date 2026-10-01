import { env } from "@/config/env";
import type { HttpMethod } from "@/lib/api/types";
import { dispatch } from "@/mocks/server/router";

/**
 * HTTP entry point of the fake backend (mock mode only). Implements docs/API.md.
 * When NEXT_PUBLIC_API_MODE=http this route is disabled and the real backend is used.
 */

export const dynamic = "force-dynamic";

/** Simulated network latency so loading states are visible during development. */
const LATENCY_MS = Number(process.env.MOCK_API_LATENCY_MS ?? 300);

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  if (env.apiMode !== "mock") {
    return Response.json({ error: { code: "NOT_FOUND", message: "Mock API is disabled" } }, { status: 404 });
  }

  const { path } = await context.params;
  const url = new URL(request.url);
  const headers = Object.fromEntries([...request.headers.entries()].map(([k, v]) => [k.toLowerCase(), v]));
  const contentType = headers["content-type"] ?? "";

  let body: unknown;
  if (request.method !== "GET" && request.method !== "DELETE") {
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      const text = await request.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          return Response.json({ error: { code: "VALIDATION_ERROR", message: "Malformed JSON body" } }, { status: 400 });
        }
      }
    }
  }

  if (LATENCY_MS > 0) await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

  const response = await dispatch({
    method: request.method as HttpMethod,
    path: `/${path.join("/")}`,
    query: url.searchParams,
    headers,
    body,
  });

  if (response.raw) {
    return new Response(response.raw.bytes as BodyInit, {
      status: response.status,
      headers: { "Content-Type": response.raw.contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }
  if (response.status === 204) return new Response(null, { status: 204 });
  return Response.json(response.body, { status: response.status });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
