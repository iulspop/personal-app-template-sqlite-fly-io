import { appConfig } from "../../app/config/app-config"
import type { DoctorFinding } from "./doctor-types"

const placeholderNames = new Set(["Personal App", "My App", "App Name"])

export function checkApp(): DoctorFinding[] {
  const findings: DoctorFinding[] = []
  findings.push({
    category: "app",
    id: "identity",
    message: placeholderNames.has(appConfig.name)
      ? "App identity still uses starter values."
      : "App identity is customized.",
    remediation: placeholderNames.has(appConfig.name)
      ? "Run pnpm setup to configure the app identity."
      : undefined,
    status: placeholderNames.has(appConfig.name) ? "warn" : "pass",
  })

  const validNames =
    appConfig.name.trim().length > 0 &&
    appConfig.shortName.trim().length > 0 &&
    appConfig.shortName.length <= 12
  findings.push({
    category: "app",
    id: "identity-contract",
    message: validNames
      ? "App name and short name satisfy the identity contract."
      : "App name or short name is invalid.",
    remediation: validNames
      ? undefined
      : "Set a non-empty name and a short name of at most 12 characters.",
    status: validNames ? "pass" : "fail",
  })
  return findings
}
