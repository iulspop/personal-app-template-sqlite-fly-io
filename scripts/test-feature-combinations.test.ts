import { describe, expect, test } from "vitest"

import type { FeatureManifest } from "./features/feature-manifest"
import { createFeatureSelections } from "./test-feature-combinations"

const createManifest = ({
  conflicts = [],
  dependencies = [],
  id,
}: {
  conflicts?: string[]
  dependencies?: string[]
  id: string
}): FeatureManifest => ({
  capabilities: [],
  checks: [],
  conflicts,
  defaultEnabled: true,
  dependencies,
  description: id,
  docs: [],
  envKeys: [],
  id,
  migrations: [],
  name: id,
  ownedPaths: [`app/features/${id}`],
  packages: { dependencies: [], devDependencies: [], scripts: [] },
  prisma: { schemaSlots: [] },
  routes: [],
  sourceSlots: [],
})

describe("feature combination generation", () => {
  test("given: discovered manifests, should: derive every valid selection without fixed feature IDs", () => {
    const manifests = [
      createManifest({ id: "todos" }),
      createManifest({ dependencies: ["todos"], id: "reports" }),
      createManifest({ conflicts: ["reports"], id: "calendar" }),
    ]

    const actual = createFeatureSelections(manifests)
    const expected = [
      { calendar: false, reports: false, todos: false },
      { calendar: false, reports: false, todos: true },
      { calendar: false, reports: true, todos: true },
      { calendar: true, reports: false, todos: false },
      { calendar: true, reports: false, todos: true },
    ]

    expect(actual).toEqual(expected)
  })
})
