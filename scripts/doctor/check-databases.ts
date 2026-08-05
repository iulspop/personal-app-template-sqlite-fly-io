import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

import type { DoctorFinding } from "./doctor-types"

export async function checkDatabases(
  projectRoot = process.cwd(),
): Promise<DoctorFinding[]> {
  const packageJson = JSON.parse(
    await readFile(resolve(projectRoot, "package.json"), "utf8"),
  ) as { scripts?: Record<string, string> }
  const scripts = packageJson.scripts ?? {}
  const paths = {
    development: "prisma/dev.db",
    e2e: scripts["test:e2e"]?.match(/DATABASE_URL=file:\.\/(\S+)/)?.[1],
    test: scripts.test?.match(/DATABASE_URL=file:\.\/(\S+)/)?.[1],
  }
  const configured = Object.values(paths).filter(Boolean)
  const isolated = configured.length === 3 && new Set(configured).size === 3
  return [
    {
      category: "database",
      id: "isolation",
      message: isolated
        ? "Development, Vitest, and Playwright use isolated database paths."
        : "Database paths are missing or overlap.",
      remediation: isolated
        ? undefined
        : "Use prisma/dev.db, prisma/test.db, and prisma/e2e.db separately.",
      status: isolated ? "pass" : "fail",
    },
  ]
}
