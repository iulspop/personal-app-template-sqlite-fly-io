import { execFile } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"
import { describe, expect, test } from "vitest"

import type { FeatureSelectionPlan } from "./plan-feature-selection"
import { assertSafeTrackedFeatureRemoval } from "./tracked-feature-removal"

const execFileAsync = promisify(execFile)

const createPlan = (): FeatureSelectionPlan => ({
  checks: [],
  deletions: ["app/features/example"],
  envKeysToRemove: [],
  packageChanges: {
    dependencies: { remove: [] },
    devDependencies: { remove: [] },
    scripts: { remove: [] },
  },
  prismaSlotsToRemove: [],
  removedCapabilities: [],
  removedFeatureIds: ["example"],
  retainedCapabilities: [],
  retainedFeatureIds: [],
  sourceSlotsToRemove: [],
})

const createRepository = async () => {
  const root = await mkdtemp(join(tmpdir(), "feature-tracked-"))
  await mkdir(join(root, "app/features/example"), { recursive: true })
  await writeFile(join(root, "app/features/example/index.ts"), "export {}\n")
  await writeFile(join(root, "README.md"), "template\n")
  await execFileAsync("git", ["init", "--quiet"], { cwd: root })
  await execFileAsync("git", ["add", "."], { cwd: root })
  await execFileAsync(
    "git",
    [
      "-c",
      "user.name=Feature Test",
      "-c",
      "user.email=feature@example.com",
      "commit",
      "--quiet",
      "-m",
      "fixture",
    ],
    { cwd: root },
  )
  return root
}

describe("assertSafeTrackedFeatureRemoval", () => {
  test("given: unrelated tracked changes, should: refuse destructive feature removal", async () => {
    const root = await createRepository()
    await writeFile(join(root, "README.md"), "changed\n")

    await expect(
      assertSafeTrackedFeatureRemoval({ edits: [], plan: createPlan(), root }),
    ).rejects.toThrow("Refusing feature removal with unrelated tracked changes")
  })

  test("given: changes only within planned operations, should: allow feature removal", async () => {
    const root = await createRepository()
    await writeFile(join(root, "app/features/example/index.ts"), "changed\n")

    await expect(
      assertSafeTrackedFeatureRemoval({ edits: [], plan: createPlan(), root }),
    ).resolves.toBeUndefined()
  })

  test("given: forced removal, should: allow unrelated tracked changes", async () => {
    const root = await createRepository()
    await writeFile(join(root, "README.md"), "changed\n")

    await expect(
      assertSafeTrackedFeatureRemoval({
        edits: [],
        force: true,
        plan: createPlan(),
        root,
      }),
    ).resolves.toBeUndefined()
  })
})
