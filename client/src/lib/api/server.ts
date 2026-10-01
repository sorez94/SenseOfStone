import "server-only";
import { cache } from "react";
import { env } from "@/config/env";
import { InProcessTransport } from "@/mocks/in-process-transport";
import { createServices } from "@/services";
import { ApiClient } from "./client";
import { HttpTransport } from "./http-transport";

/**
 * Services for Server Components (public, unauthenticated reads such as the catalog).
 * Mock mode calls the fake backend in-process; http mode calls the real backend.
 */
export const getServerServices = cache(() => {
  const transport = env.apiMode === "mock" ? new InProcessTransport() : new HttpTransport(env.apiBaseUrl);
  return createServices(new ApiClient({ transport }));
});
