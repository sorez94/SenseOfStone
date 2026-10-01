import type { ApiRequest, ApiTransport, QueryParams, TransportResponse } from "./types";

export function buildQueryString(query: QueryParams | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Sends requests over HTTP with fetch. Used in the browser and for real backends. */
export class HttpTransport implements ApiTransport {
  constructor(private readonly baseUrl: string) {}

  async send(request: ApiRequest): Promise<TransportResponse> {
    const isFormData = typeof FormData !== "undefined" && request.body instanceof FormData;
    const headers = new Headers(request.headers);
    let body: BodyInit | undefined;
    if (request.body !== undefined) {
      if (isFormData) {
        body = request.body as FormData;
      } else {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify(request.body);
      }
    }

    const response = await fetch(`${this.baseUrl}${request.path}${buildQueryString(request.query)}`, {
      method: request.method,
      headers,
      body,
      signal: request.signal,
      cache: "no-store",
    });

    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { error: { code: "INTERNAL_ERROR", message: text.slice(0, 200) } };
      }
    }
    return { status: response.status, body: parsed };
  }
}
