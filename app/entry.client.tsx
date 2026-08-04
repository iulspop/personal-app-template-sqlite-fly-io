import * as Sentry from "@sentry/react-router"
import { StrictMode, startTransition } from "react"
import { hydrateRoot } from "react-dom/client"
import { HydratedRouter } from "react-router/dom"

import { createAnalyticsConfig } from "./utils/analytics"
import { initAnalytics } from "./utils/analytics.client"
import { createMonitoringConfig } from "./utils/monitoring"

const monitoringConfig = createMonitoringConfig({
  dsn: window.ENV?.SENTRY_DSN,
  environment: window.ENV?.SENTRY_ENVIRONMENT ?? window.ENV?.MODE,
  release: window.ENV?.SENTRY_RELEASE,
  tracesSampleRate: window.ENV?.SENTRY_TRACES_SAMPLE_RATE,
})

Sentry.init({
  dsn: monitoringConfig.dsn,
  enabled: monitoringConfig.isEnabled,
  environment: monitoringConfig.environment,
  integrations: [Sentry.reactRouterTracingIntegration()],
  release: monitoringConfig.release,
  tracesSampleRate: monitoringConfig.tracesSampleRate,
})

initAnalytics(
  createAnalyticsConfig({
    apiHost: window.ENV?.POSTHOG_API_HOST,
    apiKey: window.ENV?.POSTHOG_API_KEY,
    mode: window.ENV?.MODE,
  }),
)

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter
        instrumentations={[Sentry.createSentryClientInstrumentation()]}
        onError={Sentry.sentryOnError}
      />
    </StrictMode>,
  )
})
