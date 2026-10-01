import path from "node:path";
import type { NextConfig } from "next";

/**
 * next-intl request config location.
 *
 * This is exactly what `createNextIntlPlugin()` configures (an alias for `next-intl/config`).
 * We set it directly because the plugin eagerly loads `@swc/core` (used only by its optional
 * message extractor), whose native binding refuses to load on machines where drive roots grant
 * broad write access (ERR_SWC_NATIVE_CACHE). See docs/ARCHITECTURE.md → "Localization".
 */
const I18N_REQUEST_CONFIG = "./src/i18n/request.ts";

/** Extra image hosts (e.g. the real backend's CDN), comma separated. */
const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: imageHosts.flatMap((hostname) => [
      { protocol: "https" as const, hostname },
      { protocol: "http" as const, hostname },
    ]),
  },
  turbopack: {
    resolveAlias: { "next-intl/config": I18N_REQUEST_CONFIG },
  },
  webpack(config: { resolve: { alias: Record<string, string> } }) {
    config.resolve.alias["next-intl/config"] = path.resolve(I18N_REQUEST_CONFIG);
    return config;
  },
};

export default nextConfig;
