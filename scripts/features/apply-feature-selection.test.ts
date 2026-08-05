import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, test } from "vitest"

import { applyFeatureSelection } from "./apply-feature-selection"
import type { FeatureSelectionPlan } from "./plan-feature-selection"

const createPlan = (deletions: string[] = []): FeatureSelectionPlan => ({
  checks: [],
  deletions,
  envKeysToRemove: [],
  packageChanges: {
    dependencies: { remove: [] },
    devDependencies: { remove: [] },
    scripts: { remove: [] },
  },
  prismaSlotsToRemove: [],
  removedCapabilities: [],
  removedFeatureIds: [],
  retainedCapabilities: [],
  retainedFeatureIds: [],
  sourceSlotsToRemove: [],
})

const createFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), "feature-apply-"))
  await mkdir(join(root, "feature"))
  await writeFile(join(root, "keep.txt"), "original")
  await writeFile(join(root, "feature", "remove.txt"), "remove")
  return root
}

describe("applyFeatureSelection", () => {
  test("given: a valid staged plan, should: write edits and delete owned paths", async () => {
    const root = await createFixture()

    await applyFeatureSelection({
      edits: [{ content: "updated", path: "keep.txt" }],
      plan: createPlan(["feature"]),
      root,
    })

    const actual = {
      kept: await readFile(join(root, "keep.txt"), "utf8"),
      removed: await readFile(
        join(root, "feature", "remove.txt"),
        "utf8",
      ).catch(() => null),
    }
    const expected = { kept: "updated", removed: null }

    expect(actual).toEqual(expected)
  })

  test("given: dry-run mode, should: return the plan without changing files", async () => {
    const root = await createFixture()

    const actual = await applyFeatureSelection({
      dryRun: true,
      edits: [{ content: "updated", path: "keep.txt" }],
      plan: createPlan(["feature"]),
      root,
    })
    const expected = {
      deleted: ["feature"],
      written: ["keep.txt"],
    }

    expect(actual).toEqual(expected)
    expect(await readFile(join(root, "keep.txt"), "utf8")).toEqual("original")
    expect(await readFile(join(root, "feature", "remove.txt"), "utf8")).toEqual(
      "remove",
    )
  })

  test("given: a failed preflight, should: leave every file unchanged", async () => {
    const root = await createFixture()

    await expect(
      applyFeatureSelection({
        edits: [{ content: "updated", path: "missing.txt" }],
        plan: createPlan(["feature"]),
        root,
      }),
    ).rejects.toThrow('Cannot edit missing path "missing.txt"')

    expect(await readFile(join(root, "keep.txt"), "utf8")).toEqual("original")
    expect(await readFile(join(root, "feature", "remove.txt"), "utf8")).toEqual(
      "remove",
    )
  })

  test("given: a commit operation fails, should: roll back every mutation", async () => {
    const root = await createFixture()
    let appliedOperations = 0

    await expect(
      applyFeatureSelection({
        edits: [{ content: "updated", path: "keep.txt" }],
        onOperationApplied: () => {
          appliedOperations += 1
          if (appliedOperations === 2) throw new Error("simulated failure")
        },
        plan: createPlan(["feature"]),
        root,
      }),
    ).rejects.toThrow("simulated failure")

    const actual = {
      kept: await readFile(join(root, "keep.txt"), "utf8"),
      removed: await readFile(join(root, "feature", "remove.txt"), "utf8"),
    }
    const expected = { kept: "original", removed: "remove" }

    expect(actual).toEqual(expected)
  })
})
