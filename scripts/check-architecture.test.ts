import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"

import {
  analyzeArchitecture,
  formatArchitectureViolations,
} from "./check-architecture"

const fixtures: string[] = []

async function createProject(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), "architecture-check-"))
  fixtures.push(root)
  await Promise.all(
    Object.entries(files).map(async ([path, contents]) => {
      const target = join(root, path)
      await mkdir(join(target, ".."), { recursive: true })
      await writeFile(target, contents)
    }),
  )
  return root
}

afterEach(async () => {
  await Promise.all(
    fixtures
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true })),
  )
})

describe("architecture analysis", () => {
  test("given valid feature layers, should return no violations", async () => {
    const root = await createProject({
      "app/features/todos/application/todos-page.tsx":
        'import { summarize } from "../domain/todos-domain"\nexport const value = summarize([])',
      "app/features/todos/domain/todos-domain.ts":
        "export const summarize = (items: unknown[]) => items.length",
      "app/features/todos/infrastructure/todos-model.server.ts":
        'import { summarize } from "../domain/todos-domain"\nexport const count = summarize([])',
    })

    await expect(analyzeArchitecture(root)).resolves.toEqual([])
  })

  test("given forbidden imports, should report actionable violations", async () => {
    const root = await createProject({
      "app/features/chat/application/chat-thread.tsx":
        'import { retrieve } from "../infrastructure/chat-model.server"',
      "app/features/chat/domain/chat-domain.ts":
        'import { retrieve } from "../infrastructure/chat-model.server"',
      "app/features/chat/infrastructure/chat-email.server.ts":
        'import { send } from "../application/chat-route.server"',
    })

    const actual = await analyzeArchitecture(root)

    expect(actual.map(({ rule }) => rule)).toEqual([
      "presentation-server-import",
      "domain-dependency",
      "infrastructure-dependency",
    ])
    expect(formatArchitectureViolations(actual)).toContain("fix:")
    expect(formatArchitectureViolations(actual)).not.toContain("undefined")
  })

  test("given domain framework imports, should reject them", async () => {
    const root = await createProject({
      "app/features/auth/domain/auth-domain.ts":
        'import { redirect } from "react-router"\nexport const value = redirect',
    })

    await expect(analyzeArchitecture(root)).resolves.toMatchObject([
      { imported: "react-router", rule: "domain-dependency" },
    ])
  })
})
