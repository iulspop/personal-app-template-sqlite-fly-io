import * as Sentry from "@sentry/react-router"

const tracesSampleRate = Number.parseFloat(
  process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1",
)

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate:
    Number.isFinite(tracesSampleRate) &&
    tracesSampleRate >= 0 &&
    tracesSampleRate <= 1
      ? tracesSampleRate
      : 0.1,
})
