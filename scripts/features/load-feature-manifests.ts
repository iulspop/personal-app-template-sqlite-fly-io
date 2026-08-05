import { readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import type { FeatureManifest } from "./feature-manifest"
import { parseFeatureManifests } from "./feature-manifest"

const hasPathOverlap = (left: string, right: string) =>
  left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`)

const validateReferences = (manifests: FeatureManifest[]) => {
  const ids = new Set(manifests.map(({ id }) => id))
  manifests.forEach(({ conflicts, dependencies, id }) => {
    dependencies.forEach((dependency) => {
      if (!ids.has(dependency)) {
        throw new Error(
          `Feature "${id}" depends on unknown feature "${dependency}"`,
        )
      }
    })
    conflicts.forEach((conflict) => {
      if (!ids.has(conflict)) {
        throw new Error(
          `Feature "${id}" conflicts with unknown feature "${conflict}"`,
        )
      }
    })
  })
}

const validateOwnedPaths = (manifests: FeatureManifest[]) => {
  const declarations = manifests.flatMap(({ id, ownedPaths }) =>
    ownedPaths.map((path) => ({ id, path })),
  )
  declarations.forEach((declaration, index) => {
    const overlap = declarations
      .slice(index + 1)
      .find(
        (candidate) =>
          candidate.id !== declaration.id &&
          hasPathOverlap(candidate.path, declaration.path),
      )
    if (overlap) {
      throw new Error(
        `Owned path "${declaration.path}" is declared by multiple features: "${declaration.id}" and "${overlap.id}"`,
      )
    }
  })
}

const validateDependencyCycles = (manifests: FeatureManifest[]) => {
  const dependencies = new Map(
    manifests.map(({ dependencies: featureDependencies, id }) => [
      id,
      featureDependencies,
    ]),
  )
  const visited = new Set<string>()
  const active = new Set<string>()

  const visit = (id: string, path: string[]): void => {
    if (active.has(id)) {
      throw new Error(`Feature dependency cycle: ${[...path, id].join(" -> ")}`)
    }
    if (visited.has(id)) return

    active.add(id)
    dependencies.get(id)?.forEach((dependency) => {
      visit(dependency, [...path, id])
    })
    active.delete(id)
    visited.add(id)
  }

  manifests.forEach(({ id }) => {
    visit(id, [])
  })
}

export const validateFeatureManifests = (
  inputs: readonly unknown[],
): FeatureManifest[] => {
  const manifests = parseFeatureManifests(inputs).sort(
    ({ id: left }, { id: right }) => left.localeCompare(right),
  )
  validateReferences(manifests)
  validateOwnedPaths(manifests)
  validateDependencyCycles(manifests)
  return manifests
}

export const loadFeatureManifests = async ({
  directory = resolve(process.cwd(), "scripts/features/manifests"),
}: {
  directory?: string
} = {}): Promise<FeatureManifest[]> => {
  const files = (await readdir(directory))
    .filter((file) => file.endsWith("-feature.ts"))
    .sort()
  const modules = await Promise.all(
    files.map((file) => import(pathToFileURL(resolve(directory, file)).href)),
  )

  return validateFeatureManifests(
    modules.map(({ default: manifest }) => manifest),
  )
}
