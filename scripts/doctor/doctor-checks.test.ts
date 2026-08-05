import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"

import { checkApp } from "./check-app"
import { checkArchitecture } from "./check-architecture"
import { checkDatabases } from "./check-databases"
import { checkEnv } from "./check-env"
import { checkIntegrations } from "./check-integrations"
import { checkPrisma } from "./check-prisma"
import { checkPwa } from "./check-pwa"

const fixtures: string[] = []

afterEach(async () => {
  await Promise.all(
    fixtures
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true })),
  )
})

describe("doctor checks", () => {
  test("given starter identity, should report customization guidance", () => {
    expect(checkApp()).toContainEqual(
      expect.objectContaining({ id: "identity", status: "warn" }),
    )
  })

  test("given production secrets with invalid values, should redact them", () => {
    const secret = "do-not-print-this"
    const findings = checkEnv(
      {
        APP_URL: secret,
        DATABASE_URL: "file:./prod.db",
        SESSION_SECRET: secret,
      },
      "production",
    )

    expect(JSON.stringify(findings)).not.toContain(secret)
    expect(findings.some(({ status }) => status === "fail")).toBe(true)
  })

  test("given optional providers are absent, should warn without failing", () => {
    const findings = checkIntegrations({})

    expect(findings).toHaveLength(5)
    expect(findings.every(({ status }) => status === "warn")).toBe(true)
  })

  test("given isolated database scripts, should pass isolation", async () => {
    const root = await mkdtemp(join(tmpdir(), "doctor-db-"))
    fixtures.push(root)
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        scripts: {
          test: "DATABASE_URL=file:./prisma/test.db vitest run",
          "test:e2e": "DATABASE_URL=file:./prisma/e2e.db playwright test",
        },
      }),
    )

    await expect(checkDatabases(root)).resolves.toContainEqual(
      expect.objectContaining({ id: "isolation", status: "pass" }),
    )
  })

  test("given Prisma schema and migrations, should report readiness", async () => {
    const root = await mkdtemp(join(tmpdir(), "doctor-prisma-"))
    fixtures.push(root)
    await mkdir(join(root, "prisma/migrations/001"), { recursive: true })
    await writeFile(join(root, "prisma/schema.prisma"), "generator client {}")

    const findings = await checkPrisma(root)
    expect(findings.every(({ status }) => status === "pass")).toBe(true)
  })

  test("given the starter repository, should pass PWA and architecture contracts", async () => {
    const findings = await Promise.all([checkPwa(), checkArchitecture()])

    expect(findings.flat().every(({ status }) => status !== "fail")).toBe(true)
  })
})
