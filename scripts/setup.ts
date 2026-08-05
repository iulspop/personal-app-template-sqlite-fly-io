import { execFile } from "node:child_process"
import { copyFile, readFile, writeFile } from "node:fs/promises"
import { extname, resolve } from "node:path"
import { stdin, stdout } from "node:process"
import { createInterface } from "node:readline/promises"
import { pathToFileURL } from "node:url"
import { promisify } from "node:util"

import { generatePwaAssets } from "./generate-pwa-assets"
import type { SetupConfig } from "./setup/setup-config"
import { parseSetupConfig } from "./setup/setup-config"
import { updateAppConfigSource } from "./setup/update-app-config"

const execFileAsync = promisify(execFile)

export type SetupOptions = {
  configPath?: string
  dryRun: boolean
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
    nonInteractive: args.includes("--non-interactive"),
  }
}

async function readConfigFile(path: string) {
  return parseSetupConfig(JSON.parse(await readFile(path, "utf8")))
}

async function promptForConfig(): Promise<SetupConfig> {
  const prompt = createInterface({ input: stdin, output: stdout })
  try {
    return parseSetupConfig({
      appName: await prompt.question("App name: "),
      description: await prompt.question("Description: "),
      iconSource: await prompt.question("SVG icon source path: "),
      locale: await prompt.question("Locale (for example en-US): "),
      productionUrl: await prompt.question("Production HTTPS URL: "),
      shortName: await prompt.question(
        "Install short name (12 characters max): ",
      ),
    })
  } finally {
    prompt.close()
  }
}

function preview(config: SetupConfig) {
  return [
    `App name: ${config.appName}`,
    `Short name: ${config.shortName}`,
    `Description: ${config.description}`,
    `Locale: ${config.locale}`,
    `Production URL guidance: ${config.productionUrl}`,
    `Icon source: ${config.iconSource}`,
  ].join("\n")
}

export async function runSetup(options: SetupOptions) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd())
  if (options.nonInteractive && !options.configPath) {
    throw new Error("--non-interactive requires --config")
  }

  const config = options.configPath
    ? await readConfigFile(resolve(projectRoot, options.configPath))
    : await promptForConfig()
  const iconSource = resolve(projectRoot, config.iconSource)
  if (extname(iconSource).toLowerCase() !== ".svg") {
    throw new Error("Setup v1 requires an SVG icon source")
  }
  await readFile(iconSource)

  console.log(preview(config))
  if (options.dryRun) {
    console.log("Dry run: no files changed.")
    return
  }

  if (!options.nonInteractive) {
    const prompt = createInterface({ input: stdin, output: stdout })
    const answer = await prompt.question("Apply these changes? [y/N] ")
    prompt.close()
    if (!/^y(?:es)?$/i.test(answer.trim())) {
      console.log("Setup cancelled.")
      return
    }
  }

  const appConfigPath = resolve(projectRoot, "app/config/app-config.ts")
  const canonicalIconPath = resolve(
    projectRoot,
    "public/icons/app-icon-source.svg",
  )
  const source = await readFile(appConfigPath, "utf8")
  await writeFile(appConfigPath, updateAppConfigSource(source, config))
  if (iconSource !== canonicalIconPath)
    await copyFile(iconSource, canonicalIconPath)
  await generatePwaAssets({ projectRoot, sourcePath: canonicalIconPath })
  await execFileAsync(
    "pnpm",
    ["exec", "biome", "format", "--write", appConfigPath],
    {
      cwd: projectRoot,
    },
  )

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
