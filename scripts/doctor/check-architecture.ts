import { analyzeArchitecture } from "../check-architecture"
import type { DoctorFinding } from "./doctor-types"

export async function checkArchitecture(
  projectRoot = process.cwd(),
): Promise<DoctorFinding[]> {
  const violations = await analyzeArchitecture(projectRoot)
  if (violations.length === 0) {
    return [
      {
        category: "architecture",
        id: "boundaries",
        message: "Architecture boundaries pass.",
        status: "pass",
      },
    ]
  }

  return violations.map((violation, index) => ({
    category: "architecture",
    id: `violation:${index + 1}`,
    message: `${violation.file} imports ${violation.imported} (${violation.rule}).`,
    remediation: violation.remediation,
    status: "fail",
  }))
}
