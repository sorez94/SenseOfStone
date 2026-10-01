import type { ApiRequest, ApiTransport, TransportResponse } from "@/lib/api/types";
import { dispatch } from "./server/router";

/**
 * Calls the fake backend directly inside the Next.js server process (no network hop).
 * Payloads are JSON round-tripped so callers never share object references with the mock DB,
 * exactly as with a real HTTP backend.
 */
export class InProcessTransport implements ApiTransport {
  async send(request: ApiRequest): Promise<TransportResponse> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(request.query ?? {})) {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    }
    const headers = Object.fromEntries(Object.entries(request.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    const body = request.body === undefined || request.body instanceof FormData ? request.body : JSON.parse(JSON.stringify(request.body));

    const response = await dispatch({ method: request.method, path: request.path, query, headers, body });
    return { status: response.status, body: response.body == null ? null : JSON.parse(JSON.stringify(response.body)) };
  }
}
