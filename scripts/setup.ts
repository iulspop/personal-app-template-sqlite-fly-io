import { readFile } from "node:fs/promises"
import { extname, relative, resolve } from "node:path"
import { stdin, stdout } from "node:process"
import { createInterface } from "node:readline/promises"
import { pathToFileURL } from "node:url"

import { applyFeatureSelection } from "./features/apply-feature-selection"
import type { FeatureManifest } from "./features/feature-manifest"
import { loadFeatureManifests } from "./features/load-feature-manifests"
import { planFeatureSelection } from "./features/plan-feature-selection"
import { prepareFeatureSelection } from "./features/prepare-feature-selection"
import { assertSafePrismaFeatureRemoval } from "./features/prisma-feature-history"
import { assertSafeTrackedFeatureRemoval } from "./features/tracked-feature-removal"
import { createPwaAssetEdits } from "./generate-pwa-assets"
import type { SetupConfig } from "./setup/setup-config"
import { parseSetupConfig } from "./setup/setup-config"
import { updateAppConfigSource } from "./setup/update-app-config"

export type SetupOptions = {
  configPath?: string
  dryRun: boolean
  forceFeatureRemoval?: boolean
  manifests?: FeatureManifest[]
  nonInteractive: boolean
  projectRoot?: string
}

function argumentValue(args: string[], name: string) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

export function parseSetupArguments(args: string[]): SetupOptions {
  return {
    configPath: argumentValue(args, "--config"),
    dryRun: args.includes("--dry-run"),
    forceFeatureRemoval: args.includes("--force-feature-removal"),
    nonInteractive: args.includes("--non-interactive"),
  }
}

async function readConfigFile({
  manifests,
  path,
}: {
  manifests: FeatureManifest[]
  path: string
}) {
  return parseSetupConfig(JSON.parse(await readFile(path, "utf8")), {
    featureManifests: manifests,
    requireFeatureSelections: true,
  })
}

export const formatFeaturePrompt = ({
  conflicts,
  defaultEnabled,
  dependencies,
  description,
  name,
}: FeatureManifest) => {
  const relationships = [
    dependencies.length > 0 ? `Dependencies: ${dependencies.join(", ")}.` : "",
    conflicts.length > 0 ? `Conflicts: ${conflicts.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
  const defaultChoice = defaultEnabled ? "Y/n" : "y/N"
  return `Include ${name}? ${description}${relationships ? ` ${relationships}` : ""} [${defaultChoice}] `
}

async function promptForConfig(
  manifests: FeatureManifest[],
): Promise<SetupConfig> {
  const prompt = createInterface({ input: stdin, output: stdout })
  try {
    const features = Object.fromEntries(
      await Promise.all(
        manifests.map(async (manifest) => {
          const answer = await prompt.question(formatFeaturePrompt(manifest))
          const normalized = answer.trim()
          return [
            manifest.id,
            normalized
              ? /^y(?:es)?$/i.test(normalized)
              : manifest.defaultEnabled,
          ]
        }),
      ),
    )

    return parseSetupConfig(
      {
        appName: await prompt.question("App name: "),
        description: await prompt.question("Description: "),
        features,
        iconSource: await prompt.question("SVG icon source path: "),
        locale: await prompt.question("Locale (for example en-US): "),
        productionUrl: await prompt.question("Production HTTPS URL: "),
        shortName: await prompt.question(
          "Install short name (12 characters max): ",
        ),
      },
      { featureManifests: manifests, requireFeatureSelections: true },
    )
  } finally {
    prompt.close()
  }
}

function preview({
  config,
  featurePlan,
}: {
  config: SetupConfig
  featurePlan: ReturnType<typeof planFeatureSelection>
}) {
  return [
    `App name: ${config.appName}`,
    `Short name: ${config.shortName}`,
    `Description: ${config.description}`,
    `Locale: ${config.locale}`,
    `Production URL guidance: ${config.productionUrl}`,
    `Icon source: ${config.iconSource}`,
    `Retained features: ${featurePlan.retainedFeatureIds.join(", ") || "none"}`,
    `Removed features: ${featurePlan.removedFeatureIds.join(", ") || "none"}`,
    ...featurePlan.packageChanges.dependencies.remove.map(
      (name) => `Remove dependency: ${name}`,
    ),
    ...featurePlan.packageChanges.devDependencies.remove.map(
      (name) => `Remove dev dependency: ${name}`,
    ),
    ...featurePlan.packageChanges.scripts.remove.map(
      (name) => `Remove package script: ${name}`,
    ),
    ...featurePlan.deletions.map((path) => `Delete: ${path}`),
    ...featurePlan.sourceSlotsToRemove.map(
      ({ contribution, slot }) => `Remove source slot: ${slot}:${contribution}`,
    ),
    ...featurePlan.prismaSlotsToRemove.map(
      (slot) => `Remove Prisma slot: ${slot}`,
    ),
  ].join("\n")
}

export async function runSetup(options: SetupOptions) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd())
  if (options.nonInteractive && !options.configPath) {
    throw new Error("--non-interactive requires --config")
  }

  const manifests =
    options.manifests ??
    (await loadFeatureManifests({
      directory: resolve(projectRoot, "scripts/features/manifests"),
    }))
  const config = options.configPath
    ? await readConfigFile({
        manifests,
        path: resolve(projectRoot, options.configPath),
      })
    : await promptForConfig(manifests)
  const featurePlan = planFeatureSelection({
    features: config.features,
    manifests,
  })
  const iconSource = resolve(projectRoot, config.iconSource)
  if (extname(iconSource).toLowerCase() !== ".svg") {
    throw new Error("Setup v1 requires an SVG icon source")
  }
  const iconContent = await readFile(iconSource)
  const appConfigPath = "app/config/app-config.ts"
  const canonicalIconPath = "public/icons/app-icon-source.svg"
  const appConfigSource = await readFile(
    resolve(projectRoot, appConfigPath),
    "utf8",
  )
  const identityEdits = [
    {
      content: updateAppConfigSource(appConfigSource, config),
      path: appConfigPath,
    },
    ...(relative(projectRoot, iconSource) === canonicalIconPath
      ? []
      : [{ content: iconContent, path: canonicalIconPath }]),
    ...(await createPwaAssetEdits({ sourcePath: iconSource })),
  ]

  const hasFeatureRemovals = featurePlan.removedFeatureIds.length > 0
  if (hasFeatureRemovals && featurePlan.prismaSlotsToRemove.length > 0)
    await assertSafePrismaFeatureRemoval({
      databasePath: resolve(projectRoot, "prisma/dev.db"),
      force: options.forceFeatureRemoval,
    })
  const featureEdits = hasFeatureRemovals
    ? await prepareFeatureSelection({ plan: featurePlan, root: projectRoot })
    : []

  const edits = [
    ...new Map(
      [...featureEdits, ...identityEdits].map((edit) => [edit.path, edit]),
    ).values(),
  ]

  console.log(preview({ config, featurePlan }))
  edits.forEach(({ path }) => {
    console.log(`Write: ${path}`)
  })
  if (options.dryRun) {
    console.log("Dry run: no files changed.")
    return
  }

  await assertSafeTrackedFeatureRemoval({
    edits,
    force: options.forceFeatureRemoval,
    plan: featurePlan,
    root: projectRoot,
  })

  if (!options.nonInteractive) {
    const prompt = createInterface({ input: stdin, output: stdout })
    const answer = await prompt.question("Apply these changes? [y/N] ")
    prompt.close()
    if (!/^y(?:es)?$/i.test(answer.trim())) {
      console.log("Setup cancelled.")
      return
    }
  }

  await applyFeatureSelection({ edits, plan: featurePlan, root: projectRoot })

  console.log("Setup complete.")
  console.log(
    `Manual Infisical checklist: set APP_URL=${config.productionUrl}, SESSION_SECRET, RESEND_API_KEY/EMAIL_FROM, and optional integration variables under /web.`,
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await runSetup(parseSetupArguments(process.argv.slice(2)))
}
