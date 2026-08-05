import { z } from "zod"

const setupIdentityConfigSchema = z.object({
  appName: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(200),
  iconSource: z.string().trim().min(1),
  locale: z
    .string()
    .trim()
    .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  productionUrl: z.url().refine((url) => url.startsWith("https://"), {
    message: "Production URL must use HTTPS",
  }),
  shortName: z.string().trim().min(1).max(12),
})

export const setupConfigSchema = setupIdentityConfigSchema.extend({
  features: z.record(z.string(), z.boolean()).default({}),
})

export type SetupConfig = z.infer<typeof setupConfigSchema>

type SetupFeatureManifest = {
  defaultEnabled: boolean
  dependencies: string[]
  description: string
  id: string
  name: string
}

type ParseSetupConfigOptions = {
  featureManifests?: SetupFeatureManifest[]
  requireFeatureSelections?: boolean
}

const createDefaultFeatureSelections = (
  featureManifests: SetupFeatureManifest[],
) =>
  Object.fromEntries(
    featureManifests.map(({ defaultEnabled, id }) => [id, defaultEnabled]),
  )

const validateFeatureSelections = ({
  featureManifests,
  features,
  requireFeatureSelections,
}: {
  featureManifests: SetupFeatureManifest[]
  features: Record<string, boolean>
  requireFeatureSelections: boolean
}) => {
  const featureIds = new Set(featureManifests.map(({ id }) => id))
  const unknownFeature = Object.keys(features).find((id) => !featureIds.has(id))
  if (unknownFeature) {
    throw new Error(`Unknown feature selection "${unknownFeature}"`)
  }

  if (requireFeatureSelections) {
    const missingFeature = featureManifests.find(({ id }) => !(id in features))
    if (missingFeature) {
      throw new Error(`Missing feature selection "${missingFeature.id}"`)
    }
  }
}

export function parseSetupConfig(
  input: unknown,
  {
    featureManifests = [],
    requireFeatureSelections = false,
  }: ParseSetupConfigOptions = {},
): SetupConfig {
  const identityConfig = setupIdentityConfigSchema.parse(input)
  const inputFeatures =
    typeof input === "object" && input !== null && "features" in input
      ? z.record(z.string(), z.boolean()).parse(input.features)
      : undefined
  const features =
    inputFeatures ?? createDefaultFeatureSelections(featureManifests)

  validateFeatureSelections({
    featureManifests,
    features,
    requireFeatureSelections,
  })

  return setupConfigSchema.parse({ ...identityConfig, features })
}
