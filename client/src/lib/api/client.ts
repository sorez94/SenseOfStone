import type { Paginated, PaginationMeta } from "@/domain";
import { ApiError } from "./errors";
import type { ApiRequest, ApiTransport, HttpMethod, QueryParams, SuccessEnvelope } from "./types";

export interface ApiClientOptions {
  transport: ApiTransport;
  /** Returns the current access token, if any. */
  getAccessToken?: () => string | null | undefined;
  /** Returns the active UI locale, sent as Accept-Language. */
  getLocale?: () => string | undefined;
  /** Called when the backend reports the session is no longer valid. */
  onUnauthenticated?: () => void;
}

interface RequestOptions {
  query?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Typed API client. Knows the wire envelope (docs/API.md §1) but nothing about
 * where requests go — that is the transport's job.
 */
export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  get<T>(path: string, options?: Omit<RequestOptions, "body">) {
    return this.data<T>("GET", path, options);
  }
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) {
    return this.data<T>("POST", path, { ...options, body });
  }
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) {
    return this.data<T>("PUT", path, { ...options, body });
  }
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) {
    return this.data<T>("PATCH", path, { ...options, body });
  }
  delete<T = null>(path: string, options?: Omit<RequestOptions, "body">) {
    return this.data<T>("DELETE", path, options);
  }

  /** GET a paginated collection. */
  async page<T>(path: string, options?: Omit<RequestOptions, "body">): Promise<Paginated<T>> {
    const envelope = await this.request<T[]>("GET", path, options);
    return { items: envelope.data, meta: envelope.meta ?? singlePageMeta(envelope.data.length) };
  }

  private async data<T>(method: HttpMethod, path: string, options?: RequestOptions): Promise<T> {
    return (await this.request<T>(method, path, options)).data;
  }

  private async request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<SuccessEnvelope<T>> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = this.options.getAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    const locale = this.options.getLocale?.();
    if (locale) headers["Accept-Language"] = locale;

    const request: ApiRequest = { method, path, query: options.query, body: options.body, headers, signal: options.signal };

    let response;
    try {
      response = await this.options.transport.send(request);
    } catch (cause) {
      if (cause instanceof ApiError) throw cause;
      throw ApiError.network(cause);
    }

    if (response.status < 200 || response.status >= 300) {
      const error = ApiError.fromResponse(response.status, response.body);
      if (error.status === 401 && token) this.options.onUnauthenticated?.();
      throw error;
    }
    if (response.status === 204 || response.body == null) {
      return { data: null as T };
    }
    return response.body as SuccessEnvelope<T>;
  }
}

function singlePageMeta(count: number): PaginationMeta {
  return { page: 1, pageSize: count, total: count, totalPages: 1 };
}
