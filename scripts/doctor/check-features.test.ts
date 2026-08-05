import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"

import type { FeatureManifest } from "../features/feature-manifest"
import { checkFeatures } from "./check-features"

const fixtures: string[] = []

const createManifest = (): FeatureManifest => ({
  capabilities: [],
  checks: [],
  conflicts: [],
  defaultEnabled: true,
  dependencies: [],
  description: "Fixture feature",
  docs: [],
  envKeys: [],
  id: "fixture",
  migrations: ["prisma/migrations/001_fixture"],
  name: "Fixture",
  ownedPaths: ["app/features/fixture", "app/routes/fixture.tsx"],
  packages: { dependencies: [], devDependencies: [], scripts: [] },
  prisma: { schemaSlots: ["fixtureModel"] },
  routes: ["app/routes/fixture.tsx"],
  sourceSlots: [
    { contribution: "fixtureNavigation", slot: "primaryNavigation" },
  ],
})

const createRoot = async () => {
  const root = await mkdtemp(join(tmpdir(), "doctor-features-"))
  fixtures.push(root)
  await mkdir(join(root, "app/features/fixture"), { recursive: true })
  await mkdir(join(root, "app/routes"), { recursive: true })
  await mkdir(join(root, "app/composition"), { recursive: true })
  await mkdir(join(root, "prisma/migrations/001_fixture"), { recursive: true })
  await mkdir(join(root, "prisma"), { recursive: true })
  await writeFile(join(root, "app/features/fixture/index.ts"), "export {}\n")
  await writeFile(join(root, "app/routes/fixture.tsx"), "export {}\n")
  await writeFile(
    join(root, "app/composition/navigation.ts"),
    "// FEATURE_SLOT_BEGIN:primaryNavigation:fixtureNavigation\nfixture\n// FEATURE_SLOT_END:primaryNavigation:fixtureNavigation\n",
  )
  await writeFile(
    join(root, "prisma/schema.prisma"),
    "// FEATURE_SLOT_BEGIN:prisma:fixtureModel\nmodel Fixture { id String @id }\n// FEATURE_SLOT_END:prisma:fixtureModel\n",
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

describe("feature doctor", () => {
  test("given: a complete retained feature, should: report it as healthy", async () => {
    const root = await createRoot()

    const actual = await checkFeatures({
      manifests: [createManifest()],
      projectRoot: root,
    })

    expect(actual).toContainEqual(
      expect.objectContaining({ id: "fixture:retained", status: "pass" }),
    )
  })

  test("given: a retained test-helper slot, should: include test files", async () => {
    const root = await createRoot()
    const manifest = {
      ...createManifest(),
      sourceSlots: [
        { contribution: "fixtureTestHelper", slot: "testHelpers" as const },
      ],
    }
    await writeFile(
      join(root, "app/features/fixture/helper.test.ts"),
      "// FEATURE_SLOT_BEGIN:testHelpers:fixtureTestHelper\nfixture\n// FEATURE_SLOT_END:testHelpers:fixtureTestHelper\n",
    )

    const actual = await checkFeatures({
      manifests: [manifest],
      projectRoot: root,
    })

    expect(actual).not.toContainEqual(
      expect.objectContaining({ id: "fixture:source-slots", status: "fail" }),
    )
  })

  test("given: a partially removed feature, should: report a failure", async () => {
    const root = await createRoot()
    await rm(join(root, "app/routes/fixture.tsx"))

    const actual = await checkFeatures({
      manifests: [createManifest()],
      projectRoot: root,
    })

    expect(actual).toContainEqual(
      expect.objectContaining({ id: "fixture:partial", status: "fail" }),
    )
  })

  test("given: a fully removed feature, should: reject orphaned source slots", async () => {
    const root = await createRoot()
    await rm(join(root, "app/features/fixture"), { recursive: true })
    await rm(join(root, "app/routes/fixture.tsx"))

    const actual = await checkFeatures({
      manifests: [createManifest()],
      projectRoot: root,
    })

    expect(actual).toContainEqual(
      expect.objectContaining({ id: "fixture:source-slots", status: "fail" }),
    )
  })
})
