import { featureIntegrationChecks } from "../../app/composition/generated/integration-checks"
import type { ServerEnvSource } from "../../app/config/server-env"
import type { DoctorFinding } from "./doctor-types"

function configured(source: ServerEnvSource, names: (keyof ServerEnvSource)[]) {
  return names.every(
    (name) => typeof source[name] === "string" && source[name] !== "",
  )
}

export function checkIntegrations(source: ServerEnvSource): DoctorFinding[] {
  const integrations = [
    ["auth-email", ["RESEND_API_KEY", "EMAIL_FROM"], "Resend email"],
    ...featureIntegrationChecks,
    ["posthog", ["POSTHOG_API_KEY"], "PostHog"],
    ["sentry", ["SENTRY_DSN"], "Sentry"],
  ] as const

  return integrations.map(([id, names, label]) => {
    const ready = configured(source, [...names])
    return {
      category: "integrations",
      id,
      message: `${label} is ${ready ? "configured" : "not configured"}.`,
      remediation: ready
        ? undefined
        : `Configure ${names.join(", ")} in Infisical /web if this integration is needed.`,
      status: ready ? "pass" : "warn",
    }
  })
}
