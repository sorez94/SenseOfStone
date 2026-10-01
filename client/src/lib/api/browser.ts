import { env } from "@/config/env";
import { createServices, type Services } from "@/services";
import { ApiClient } from "./client";
import { HttpTransport } from "./http-transport";
import { tokenStorage } from "./token-storage";

/** Creates the services used by Client Components. Always HTTP (to the mock route or the real backend). */
export function createBrowserServices(options: { getLocale: () => string; onUnauthenticated: () => void }): Services {
  const api = new ApiClient({
    transport: new HttpTransport(env.apiBaseUrl),
    getAccessToken: tokenStorage.get,
    getLocale: options.getLocale,
    onUnauthenticated: options.onUnauthenticated,
  });
  return createServices(api);
}
