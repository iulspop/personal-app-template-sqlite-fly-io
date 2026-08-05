import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, test } from "vitest"

import type { FeatureSelectionPlan } from "./plan-feature-selection"
import { prepareFeatureSelection } from "./prepare-feature-selection"

const createPlan = (): FeatureSelectionPlan => ({
  checks: [],
  deletions: [],
  envKeysToRemove: [],
  packageChanges: {
    dependencies: { remove: ["feature-package"] },
    devDependencies: { remove: [] },
    scripts: { remove: ["feature:check"] },
  },
  prismaSlotsToRemove: ["featureModel"],
  removedCapabilities: [],
  removedFeatureIds: ["feature"],
  retainedCapabilities: [],
  retainedFeatureIds: [],
  sourceSlotsToRemove: [
    { contribution: "featureNavigation", slot: "primaryNavigation" },
    { contribution: "featureNavigationTest", slot: "primaryNavigation" },
  ],
})

describe("prepare feature selection", () => {
  test("given: a removal plan, should: prepare exact source, schema, and package edits", async () => {
    const root = await mkdtemp(join(tmpdir(), "prepare-feature-"))
    await mkdir(join(root, "app"), { recursive: true })
    await mkdir(join(root, "prisma"), { recursive: true })
    await writeFile(
      join(root, "app/navigation.ts"),
      "before\n// FEATURE_SLOT_BEGIN:primaryNavigation:featureNavigation\nfeature\n// FEATURE_SLOT_END:primaryNavigation:featureNavigation\nafter\n",
    )
    await writeFile(
      join(root, "app/navigation.test.ts"),
      "// FEATURE_SLOT_BEGIN:primaryNavigation:featureNavigationTest\nfixture\n// FEATURE_SLOT_END:primaryNavigation:featureNavigationTest\n",
    )
    await writeFile(
      join(root, "prisma/schema.prisma"),
      "// FEATURE_SLOT_BEGIN:prisma:featureModel\nmodel Feature { id String @id }\n// FEATURE_SLOT_END:prisma:featureModel\n",
    )
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        dependencies: { "feature-package": "1.0.0", keep: "1.0.0" },
        scripts: { check: "keep", "feature:check": "feature check" },
      }),
    )

    const actual = await prepareFeatureSelection({ plan: createPlan(), root })
    const expectedPaths = [
      "app/navigation.test.ts",
      "app/navigation.ts",
      "package.json",
      "prisma/schema.prisma",
    ]

    expect(actual.map(({ path }) => path)).toEqual(expectedPaths)
    const packageContent = actual.find(
      ({ path }) => path === "package.json",
    )?.content
    expect(packageContent).toContain('"keep": "1.0.0"')
    expect(packageContent).toContain('"check": "keep"')
    expect(packageContent).not.toContain("feature:check")
    expect(await readFile(join(root, "app/navigation.ts"), "utf8")).toContain(
      "featureNavigation",
    )
  })
})
