import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

export default {
  buildEnd: ({ viteConfig, reactRouterConfig, buildManifest }) =>
    sentryOnBuildEnd({ buildManifest, reactRouterConfig, viteConfig }),
  future: {
    v8_middleware: true,
  },
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
} satisfies Config;
