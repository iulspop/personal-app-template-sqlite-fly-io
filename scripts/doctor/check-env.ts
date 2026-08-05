import type { RuntimeMode, ServerEnvSource } from "../../app/config/server-env"
import {
  parseServerEnv,
  ServerEnvValidationError,
} from "../../app/config/server-env.server"
import type { DoctorFinding } from "./doctor-types"

export function checkEnv(
  source: ServerEnvSource,
  mode: RuntimeMode,
): DoctorFinding[] {
  try {
    parseServerEnv(source, mode)
    return [
      {
        category: "environment",
        id: "schema",
        message: `Server environment is valid for ${mode}.`,
        status: "pass",
      },
    ]
  } catch (error) {
    if (!(error instanceof ServerEnvValidationError)) throw error
    return error.issues.map((issue) => ({
      category: "environment",
      id: `env:${issue.path}`,
      message: `${issue.path}: ${issue.message}`,
      remediation: `Configure ${issue.path} in Infisical /web.`,
      status: "fail",
    }))
  }
}
