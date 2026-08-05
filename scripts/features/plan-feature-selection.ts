import type { FeatureManifest } from "./feature-manifest"

export type FeatureSelectionPlan = {
  checks: string[]
  deletions: string[]
  envKeysToRemove: string[]
  packageChanges: {
    dependencies: { remove: string[] }
    devDependencies: { remove: string[] }
    scripts: { remove: string[] }
  }
  prismaSlotsToRemove: string[]
  removedCapabilities: string[]
  removedFeatureIds: string[]
  retainedCapabilities: string[]
  retainedFeatureIds: string[]
  sourceSlotsToRemove: FeatureManifest["sourceSlots"]
}

const uniqueSorted = (values: readonly string[]) => [...new Set(values)].sort()

const removeNestedPaths = (paths: readonly string[]) =>
  uniqueSorted(paths).filter(
    (path, _index, sortedPaths) =>
      !sortedPaths.some(
        (candidate) => candidate !== path && path.startsWith(`${candidate}/`),
      ),
  )

const isOwnedPath = (file: string, ownedPath: string) =>
  file === ownedPath || file.startsWith(`${ownedPath}/`)

const resolveImportedProjectPath = (specifier: string) =>
  specifier.startsWith("~/") ? `app/${specifier.slice(2)}` : specifier

const listImportSpecifiers = (content: string) =>
  [...content.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map(
    ([, specifier]) => resolveImportedProjectPath(specifier),
  )

const validateSelection = ({
  features,
  manifests,
}: {
  features: Record<string, boolean>
  manifests: FeatureManifest[]
}) => {
  manifests.forEach(({ conflicts, dependencies, id }) => {
    if (!features[id]) return

    dependencies.forEach((dependency) => {
      if (!features[dependency])
        throw new Error(
          `Feature "${id}" requires selected feature "${dependency}"`,
        )
    })
    conflicts.forEach((conflict) => {
      if (features[conflict])
        throw new Error(`Feature "${id}" conflicts with feature "${conflict}"`)
    })
  })
}

const validateOptionalFeatureImports = ({
  manifests,
  projectFiles,
  retainedFeatureIds,
}: {
  manifests: FeatureManifest[]
  projectFiles: Record<string, string>
  retainedFeatureIds: string[]
}) => {
  const retainedIds = new Set(retainedFeatureIds)

  manifests
    .filter(({ id }) => retainedIds.has(id))
    .forEach((manifest) => {
      Object.entries(projectFiles)
        .filter(([file]) =>
          manifest.ownedPaths.some((ownedPath) => isOwnedPath(file, ownedPath)),
        )
        .flatMap(([, content]) => listImportSpecifiers(content))
        .forEach((specifier) => {
          const importedFeature = manifests.find(
            ({ id, ownedPaths }) =>
              id !== manifest.id &&
              ownedPaths.some((ownedPath) => isOwnedPath(specifier, ownedPath)),
          )
          if (
            importedFeature &&
            !manifest.dependencies.includes(importedFeature.id)
          )
            throw new Error(
              `Feature "${manifest.id}" imports optional feature "${importedFeature.id}" without declaring a dependency`,
            )
        })
    })
}

const listCapabilityResources = (manifests: FeatureManifest[]) =>
  manifests.flatMap(({ capabilityResources = [] }) => capabilityResources)

const planPackageRemovals = ({
  removed,
  removedCapabilities,
  retained,
  section,
}: {
  removed: FeatureManifest[]
  removedCapabilities: string[]
  retained: FeatureManifest[]
  section: "dependencies" | "devDependencies" | "scripts"
}) => {
  const retainedPackages = new Set(
    retained.flatMap(({ packages }) => packages[section]),
  )
  const removedCapabilityPackages = listCapabilityResources(removed)
    .filter(({ capability }) => removedCapabilities.includes(capability))
    .flatMap(({ packages }) => packages[section])

  return uniqueSorted(
    [
      ...removed.flatMap(({ packages }) => packages[section]),
      ...removedCapabilityPackages,
    ].filter((name) => !retainedPackages.has(name)),
  )
}

export const planFeatureSelection = ({
  features,
  manifests,
  projectFiles = {},
}: {
  features: Record<string, boolean>
  manifests: FeatureManifest[]
  projectFiles?: Record<string, string>
}): FeatureSelectionPlan => {
  validateSelection({ features, manifests })
  const retained = manifests.filter(({ id }) => features[id])
  const removed = manifests.filter(({ id }) => !features[id])
  const retainedFeatureIds = retained.map(({ id }) => id).sort()
  const allCapabilities = uniqueSorted(
    manifests.flatMap(({ capabilities }) => capabilities),
  )
  const retainedCapabilities = uniqueSorted(
    retained.flatMap(({ capabilities }) => capabilities),
  )
  const removedCapabilities = allCapabilities.filter(
    (capability) => !retainedCapabilities.includes(capability),
  )
  validateOptionalFeatureImports({
    manifests,
    projectFiles,
    retainedFeatureIds,
  })

  return {
    checks: uniqueSorted(retained.flatMap(({ checks }) => checks)),
    deletions: removeNestedPaths([
      ...removed.flatMap(({ migrations, ownedPaths }) => [
        ...ownedPaths,
        ...migrations,
      ]),
      ...listCapabilityResources(removed)
        .filter(({ capability }) => removedCapabilities.includes(capability))
        .flatMap(({ ownedPaths }) => ownedPaths),
    ]),
    envKeysToRemove: uniqueSorted(removed.flatMap(({ envKeys }) => envKeys)),
    packageChanges: {
      dependencies: {
        remove: planPackageRemovals({
          removed,
          removedCapabilities,
          retained,
          section: "dependencies",
        }),
      },
      devDependencies: {
        remove: planPackageRemovals({
          removed,
          removedCapabilities,
          retained,
          section: "devDependencies",
        }),
      },
      scripts: {
        remove: planPackageRemovals({
          removed,
          removedCapabilities,
          retained,
          section: "scripts",
        }),
      },
    },
    prismaSlotsToRemove: uniqueSorted(
      removed.flatMap(({ prisma }) => prisma.schemaSlots),
    ),
    removedCapabilities: allCapabilities.filter(
      (capability) => !retainedCapabilities.includes(capability),
    ),
    removedFeatureIds: removed.map(({ id }) => id).sort(),
    retainedCapabilities,
    retainedFeatureIds,
    sourceSlotsToRemove: removed
      .flatMap(({ sourceSlots }) => sourceSlots)
      .sort(({ contribution: left }, { contribution: right }) =>
        left.localeCompare(right),
      ),
  }
}
