import { describe, expect, test } from "vitest"

import { parseFeatureManifest, parseFeatureManifests } from "./feature-manifest"

const validManifest = {
  capabilities: ["clientWorkflows"],
  checks: ["pnpm typecheck"],
  conflicts: [],
  defaultEnabled: true,
  dependencies: [],
  description: "A focused optional feature.",
  docs: ["README.md"],
  envKeys: ["FEATURE_API_KEY"],
  id: "sampleFeature",
  migrations: ["prisma/migrations/20260805000000_add_sample"],
  name: "Sample feature",
  ownedPaths: ["app/features/sample"],
  packages: {
    dependencies: ["sample-package"],
    devDependencies: [],
    scripts: ["sample:check"],
  },
  prisma: {
    schemaSlots: ["sampleFeature.models"],
  },
  routes: ["app/routes/sample.tsx"],
  sourceSlots: [
    {
      contribution: "sampleFeatureNavigation",
      slot: "primaryNavigation",
    },
  ],
}

describe("feature manifest", () => {
  test("given: a complete manifest, should: return normalized declarative metadata", () => {
    const actual = parseFeatureManifest(validManifest)
    const expected = validManifest

    expect(actual).toEqual(expected)
  })

  test("given: executable or unknown manifest fields, should: reject the manifest", () => {
    const actual = () =>
      parseFeatureManifest({
        ...validManifest,
        apply: () => undefined,
      })

    expect(actual).toThrow()
  })

  test("given: duplicate feature IDs, should: reject the declarations", () => {
    const actual = () =>
      parseFeatureManifests([
        validManifest,
        { ...validManifest, name: "Duplicate sample" },
      ])

    expect(actual).toThrow('Duplicate feature manifest ID "sampleFeature"')
  })

  test("given: duplicate owned paths inside a manifest, should: reject it", () => {
    const actual = () =>
      parseFeatureManifest({
        ...validManifest,
        ownedPaths: ["app/features/sample", "app/features/sample"],
      })

    expect(actual).toThrow("Duplicate ownedPaths value")
  })
})
