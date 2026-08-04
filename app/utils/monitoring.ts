export type MonitoringConfig = {
  dsn: string
  environment: string
  isEnabled: boolean
  release: string | undefined
  tracesSampleRate: number
}

type CreateMonitoringConfigInput = {
  dsn: string | undefined
  environment: string | undefined
  release: string | undefined
  tracesSampleRate: string | undefined
}

const defaultTracesSampleRate = 0.1

export function createMonitoringConfig({
  dsn = "",
  environment = "development",
  release,
  tracesSampleRate,
}: CreateMonitoringConfigInput): MonitoringConfig {
  const parsedSampleRate = Number.parseFloat(tracesSampleRate ?? "")

  return {
    dsn,
    environment,
    isEnabled: dsn.length > 0,
    release,
    tracesSampleRate:
      Number.isFinite(parsedSampleRate) &&
      parsedSampleRate >= 0 &&
      parsedSampleRate <= 1
        ? parsedSampleRate
        : defaultTracesSampleRate,
  }
}
