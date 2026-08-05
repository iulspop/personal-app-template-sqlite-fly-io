import { access, readdir } from "node:fs/promises"
import { resolve } from "node:path"

import type { DoctorFinding } from "./doctor-types"

export async function checkPrisma(
  projectRoot = process.cwd(),
): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = []
  try {
    await access(resolve(projectRoot, "prisma/schema.prisma"))
    findings.push({
      category: "prisma",
      id: "schema",
      message: "Prisma schema is present.",
      status: "pass",
    })
  } catch {
    findings.push({
      category: "prisma",
      id: "schema",
      message: "Prisma schema is missing.",
      remediation: "Restore prisma/schema.prisma.",
      status: "fail",
    })
  }

  try {
    const migrations = await readdir(
      resolve(projectRoot, "prisma/migrations"),
      { withFileTypes: true },
    )
    const count = migrations.filter((entry) => entry.isDirectory()).length
    findings.push({
      category: "prisma",
      id: "migrations",
      message: `${count} Prisma migration${count === 1 ? "" : "s"} found.`,
      remediation:
        count > 0
          ? undefined
          : "Create and commit the initial Prisma migration.",
      status: count > 0 ? "pass" : "fail",
    })
  } catch {
    findings.push({
      category: "prisma",
      id: "migrations",
      message: "Prisma migrations directory is missing.",
      remediation: "Restore committed Prisma migrations.",
      status: "fail",
    })
  }
  return findings
}
