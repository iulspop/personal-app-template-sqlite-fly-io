import type { Config } from "@react-router/dev/config"
import { sentryOnBuildEnd } from "@sentry/react-router"

const sentryBuildEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT,
)

export default {
  buildEnd: sentryBuildEnabled ? sentryOnBuildEnd : undefined,
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
} satisfies Config
