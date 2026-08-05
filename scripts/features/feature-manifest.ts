import { z } from "zod"

export const featureSourceSlotNames = [
  "authenticatedProviders",
  "documentation",
  "homeContent",
  "primaryNavigation",
  "reduxReducers",
  "reduxSagas",
  "rootLoaderExtensions",
  "serverEnvExtensions",
  "settingsLinks",
  "testHelpers",
] as const

const identifierSchema = z
  .string()
  .trim()
  .regex(/^[a-z][A-Za-z0-9]*$/)
const nonEmptyStringSchema = z.string().trim().min(1)
const projectPathSchema = nonEmptyStringSchema.refine(
  (path) => !path.startsWith("/") && !path.split("/").includes(".."),
  "Paths must be project-relative and cannot traverse parent directories",
)

const uniqueStrings = (field: string) =>
  z.array(nonEmptyStringSchema).superRefine((values, context) => {
    const duplicate = values.find(
      (value, index) => values.indexOf(value) !== index,
    )
    if (duplicate) {
      context.addIssue({
        code: "custom",
        message: `Duplicate ${field} value "${duplicate}"`,
      })
    }
  })

const uniquePaths = (field: string) =>
  z.array(projectPathSchema).superRefine((values, context) => {
    const duplicate = values.find(
      (value, index) => values.indexOf(value) !== index,
    )
    if (duplicate) {
      context.addIssue({
        code: "custom",
        message: `Duplicate ${field} value "${duplicate}"`,
      })
    }
  })

export const featureManifestSchema = z
  .object({
    capabilities: uniqueStrings("capabilities"),
    capabilityResources: z
      .array(
        z
          .object({
            capability: identifierSchema,
            ownedPaths: uniquePaths("capabilityResources.ownedPaths"),
            packages: z
              .object({
                dependencies: uniqueStrings(
                  "capabilityResources.packages.dependencies",
                ),
                devDependencies: uniqueStrings(
                  "capabilityResources.packages.devDependencies",
                ),
                scripts: uniqueStrings("capabilityResources.packages.scripts"),
              })
              .strict(),
          })
          .strict(),
      )
      .optional(),
    checks: uniqueStrings("checks"),
    conflicts: uniqueStrings("conflicts"),
    defaultEnabled: z.boolean(),
    dependencies: uniqueStrings("dependencies"),
    description: nonEmptyStringSchema,
    docs: uniquePaths("docs"),
    envKeys: uniqueStrings("envKeys"),
    id: identifierSchema,
    migrations: uniquePaths("migrations"),
    name: nonEmptyStringSchema,
    ownedPaths: uniquePaths("ownedPaths"),
    packages: z
      .object({
        dependencies: uniqueStrings("packages.dependencies"),
        devDependencies: uniqueStrings("packages.devDependencies"),
        scripts: uniqueStrings("packages.scripts"),
      })
      .strict(),
    prisma: z
      .object({
        schemaSlots: uniqueStrings("prisma.schemaSlots"),
      })
      .strict(),
    routes: uniquePaths("routes"),
    sourceSlots: z.array(
      z
        .object({
          contribution: identifierSchema,
          slot: z.enum(featureSourceSlotNames),
        })
        .strict(),
    ),
  })
  .strict()

export type FeatureManifest = z.infer<typeof featureManifestSchema>

export const parseFeatureManifest = (input: unknown): FeatureManifest =>
  featureManifestSchema.parse(input)

export const parseFeatureManifests = (
  inputs: readonly unknown[],
): FeatureManifest[] => {
  const manifests = inputs.map(parseFeatureManifest)
  const duplicateId = manifests
    .map(({ id }) => id)
    .find((id, index, ids) => ids.indexOf(id) !== index)

  if (duplicateId) {
    throw new Error(`Duplicate feature manifest ID "${duplicateId}"`)
  }

  return manifests
}
