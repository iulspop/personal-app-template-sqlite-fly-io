import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"

import { loadFeatureManifests } from "./load-feature-manifests"

const temporaryDirectories: string[] = []

const createManifest = ({
  dependencies = [],
  id,
  ownedPaths = [`app/features/${id}`],
}: {
  dependencies?: string[]
  id: string
  ownedPaths?: string[]
}) => ({
  capabilities: [],
  checks: [],
  conflicts: [],
  defaultEnabled: true,
  dependencies,
  description: `${id} description`,
  docs: [],
  envKeys: [],
  id,
  migrations: [],
  name: id,
  ownedPaths,
  packages: { dependencies: [], devDependencies: [], scripts: [] },
  prisma: { schemaSlots: [] },
  routes: [],
  sourceSlots: [],
})

const createManifestDirectory = async (
  manifests: ReturnType<typeof createManifest>[],
) => {
  const directory = await mkdtemp(join(tmpdir(), "feature-manifests-"))
  temporaryDirectories.push(directory)
  await Promise.all(
    manifests.map((manifest, index) =>
      writeFile(
        join(
          directory,
          `${String(index).padStart(2, "0")}-${manifest.id}-feature.ts`,
        ),
        `export default ${JSON.stringify(manifest)}`,
      ),
    ),
  )
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe("feature manifest discovery", () => {
  test("given: independently declared manifests, should: load them in stable ID order", async () => {
    const directory = await createManifestDirectory([
      createManifest({ id: "todos" }),
      createManifest({ id: "founderChat" }),
      createManifest({ id: "aiChat" }),
    ])

    const actual = (await loadFeatureManifests({ directory })).map(
      ({ id }) => id,
    )
    const expected = ["aiChat", "founderChat", "todos"]

    expect(actual).toEqual(expected)
  })

  test("given: an unresolved dependency, should: reject discovery", async () => {
    const directory = await createManifestDirectory([
      createManifest({ dependencies: ["missingFeature"], id: "todos" }),
    ])

    const actual = loadFeatureManifests({ directory })

    await expect(actual).rejects.toThrow(
      'Feature "todos" depends on unknown feature "missingFeature"',
    )
  })

  test("given: a dependency cycle, should: reject discovery", async () => {
    const directory = await createManifestDirectory([
      createManifest({ dependencies: ["founderChat"], id: "todos" }),
      createManifest({ dependencies: ["todos"], id: "founderChat" }),
    ])

    const actual = loadFeatureManifests({ directory })

    await expect(actual).rejects.toThrow("Feature dependency cycle")
  })

  test("given: overlapping owned paths, should: reject discovery", async () => {
    const directory = await createManifestDirectory([
      createManifest({ id: "todos", ownedPaths: ["app/shared"] }),
      createManifest({ id: "founderChat", ownedPaths: ["app/shared"] }),
    ])

    const actual = loadFeatureManifests({ directory })

    await expect(actual).rejects.toThrow(
      'Owned path "app/shared" is declared by multiple features',
    )
  })
})
