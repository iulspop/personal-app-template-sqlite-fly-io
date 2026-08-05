import { access, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, test } from "vitest"

import { loadFeatureManifests } from "../load-feature-manifests"

const projectRoot = process.cwd()

const pathExists = async (path: string) => {
  try {
    await access(resolve(projectRoot, path))
    return true
  } catch {
    return false
  }
}

describe("production feature manifests", () => {
  test("given: production manifests, should: discover stable feature IDs", async () => {
    const actual = (await loadFeatureManifests()).map(({ id }) => id)
    const expected = ["founderChat", "todos"]

    expect(actual).toEqual(expected)
  })

  test("given: declared feature paths, should: reference existing project content", async () => {
    const manifests = await loadFeatureManifests()
    const paths = manifests.flatMap(
      ({ docs, migrations, ownedPaths, routes }) => [
        ...docs,
        ...migrations,
        ...ownedPaths,
        ...routes,
      ],
    )
    const actual = await Promise.all(
      paths.map(async (path) => ({ exists: await pathExists(path), path })),
    )
    const expected = actual.map(({ path }) => ({ exists: true, path }))

    expect(actual).toEqual(expected)
  })

  test("given: declared feature packages, should: reference installed dependencies", async () => {
    const manifests = await loadFeatureManifests()
    const packageJson = JSON.parse(
      await readFile(resolve(projectRoot, "package.json"), "utf8"),
    ) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    const actual = manifests.flatMap(({ id, packages }) =>
      [
        ...packages.dependencies.map((name) => ({
          id,
          name,
          section: "dependencies",
        })),
        ...packages.devDependencies.map((name) => ({
          id,
          name,
          section: "devDependencies",
        })),
      ].filter(
        ({ name, section }) =>
          !(name in packageJson[section as "dependencies" | "devDependencies"]),
      ),
    )
    const expected: typeof actual = []

    expect(actual).toEqual(expected)
  })

  test("given: source contributions, should: declare unique contribution IDs", async () => {
    const contributions = (await loadFeatureManifests()).flatMap(
      ({ id, sourceSlots }) =>
        sourceSlots.map(({ contribution, slot }) => ({
          contribution,
          id,
          slot,
        })),
    )
    const actual = contributions.filter(
      ({ contribution }, index) =>
        contributions.findIndex(
          (candidate) => candidate.contribution === contribution,
        ) !== index,
    )
    const expected: typeof actual = []

    expect(actual).toEqual(expected)
  })
})
