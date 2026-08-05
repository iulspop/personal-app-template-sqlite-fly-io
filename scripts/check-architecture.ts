import { access, readdir, readFile } from "node:fs/promises"
import { relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"

import type { FeatureManifest } from "./features/feature-manifest"
import { loadFeatureManifests } from "./features/load-feature-manifests"

export type ArchitectureViolation = {
  file: string
  imported: string
  remediation: string
  rule: string
}

const sourceExtensions = [".ts", ".tsx"]
const ignoredSuffixes = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"]
const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) return listSourceFiles(path)
      if (!sourceExtensions.some((extension) => entry.name.endsWith(extension)))
        return []
      return [path]
    }),
  )
  return files.flat()
}

function normalized(path: string) {
  return path.split(sep).join("/")
}

function featureLayer(file: string) {
  return normalized(file).match(
    /\/features\/[^/]+\/(domain|application|infrastructure)\//,
  )?.[1]
}

function isFrameworkImport(imported: string) {
  return (
    imported === "react" ||
    imported === "react-router" ||
    imported.startsWith("@prisma/") ||
    imported.startsWith("node:") ||
    imported === "resend" ||
    imported === "twilio"
  )
}

function isReduxImport(imported: string) {
  return ["react-redux", "redux", "redux-saga"].some(
    (packageName) =>
      imported === packageName || imported.startsWith(`${packageName}/`),
  )
}

function workflowFileType(file: string) {
  return file.match(/(?:^|\/)[^/]*-(reducer|sagas|selectors)\.tsx?$/)?.[1]
}

function directEffectGlobal(source: string) {
  return [
    /\bEventSource\b/,
    /\bfetch\s*\(/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bwindow\b/,
    /\bdocument\b/,
    /\bnavigator\b/,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
  ].find((pattern) => pattern.test(source))
}

function isClientAdapterImport(imported: string) {
  return /\/infrastructure\/[^/]+\.client$/.test(imported)
}

const manifestFeatureDirectory = (manifest: FeatureManifest) =>
  manifest.ownedPaths
    .map((path) => path.match(/^app\/features\/([^/]+)$/)?.[1])
    .find(Boolean)

export async function analyzeArchitecture(
  projectRoot = process.cwd(),
  manifests?: FeatureManifest[],
): Promise<ArchitectureViolation[]> {
  const featuresRoot = resolve(projectRoot, "app/features")
  const manifestDirectory = resolve(projectRoot, "scripts/features/manifests")
  const discoveredManifests =
    manifests ??
    ((await access(manifestDirectory).then(
      () => true,
      () => false,
    ))
      ? await loadFeatureManifests({ directory: manifestDirectory })
      : [])
  const manifestsByDirectory = new Map(
    discoveredManifests.flatMap((manifest) => {
      const directory = manifestFeatureDirectory(manifest)
      return directory ? [[directory, manifest] as const] : []
    }),
  )
  const files = await listSourceFiles(featuresRoot)
  const violations: ArchitectureViolation[] = []

  for (const absoluteFile of files) {
    const file = normalized(relative(projectRoot, absoluteFile))
    if (ignoredSuffixes.some((suffix) => file.endsWith(suffix))) continue

    const layer = featureLayer(absoluteFile)
    const source = await readFile(absoluteFile, "utf8")
    const workflowType = workflowFileType(file)

    const directEffect = workflowType ? directEffectGlobal(source) : undefined
    if (directEffect) {
      violations.push({
        file,
        imported: String(directEffect),
        remediation:
          "Move browser, network, storage, and timer effects behind a typed port implemented by a client adapter.",
        rule: "workflow-direct-effect",
      })
    }

    for (const match of source.matchAll(importPattern)) {
      const imported = match[1]
      if (!imported) continue

      const sourceDirectory = file.match(/^app\/features\/([^/]+)\//)?.[1]
      const targetDirectory = imported.match(/^~\/features\/([^/]+)\//)?.[1]
      const sourceManifest = sourceDirectory
        ? manifestsByDirectory.get(sourceDirectory)
        : undefined
      const targetManifest = targetDirectory
        ? manifestsByDirectory.get(targetDirectory)
        : undefined
      if (
        sourceManifest &&
        targetManifest &&
        sourceManifest.id !== targetManifest.id &&
        !sourceManifest.dependencies.includes(targetManifest.id)
      )
        violations.push({
          file,
          imported,
          remediation: `Declare "${targetManifest.id}" in the "${sourceManifest.id}" feature manifest dependencies or remove the cross-feature import.`,
          rule: "undeclared-feature-dependency",
        })

      if (layer === "domain" && isReduxImport(imported)) {
        violations.push({
          file,
          imported,
          remediation:
            "Keep Redux actions, reducers, selectors, and sagas in the application layer.",
          rule: "domain-redux-import",
        })
      } else if (
        layer === "domain" &&
        (imported.includes("/application/") ||
          imported.includes("/infrastructure/") ||
          isFrameworkImport(imported))
      ) {
        violations.push({
          file,
          imported,
          remediation:
            "Pass values through a domain API and keep framework or adapter code outside domain.",
          rule: "domain-dependency",
        })
      }

      if (layer === "infrastructure" && imported.includes("/application/")) {
        violations.push({
          file,
          imported,
          remediation:
            "Move shared contracts to domain or pass application-owned values into infrastructure.",
          rule: "infrastructure-dependency",
        })
      }

      if (
        (workflowType === "reducer" || workflowType === "selectors") &&
        imported.includes("/infrastructure/")
      ) {
        violations.push({
          file,
          imported,
          remediation:
            "Keep reducers and selectors pure; inject infrastructure through sagas and typed domain ports.",
          rule: "workflow-infrastructure-import",
        })
      } else if (isClientAdapterImport(imported)) {
        violations.push({
          file,
          imported,
          remediation:
            "Import concrete client adapters only from the store composition boundary.",
          rule: "client-adapter-composition",
        })
      }

      const isPresentation =
        layer === "application" &&
        !file.includes(".server.") &&
        !file.endsWith(".css.ts")
      if (
        isPresentation &&
        /(?:model|action)\.server(?:\.[jt]sx?)?$/.test(imported)
      ) {
        violations.push({
          file,
          imported,
          remediation:
            "Load data through a route or server adapter and pass browser-safe props to presentation code.",
          rule: "presentation-server-import",
        })
      }
    }
  }

  return violations.sort((left, right) =>
    `${left.file}:${left.imported}`.localeCompare(
      `${right.file}:${right.imported}`,
    ),
  )
}

export function formatArchitectureViolations(
  violations: ArchitectureViolation[],
) {
  return violations
    .map(
      ({ file, imported, remediation, rule }) =>
        `${file}\n  import: ${imported}\n  rule: ${rule}\n  fix: ${remediation}`,
    )
    .join("\n\n")
}

async function main() {
  const violations = await analyzeArchitecture()
  if (violations.length === 0) {
    console.log("Architecture boundaries passed.")
    return
  }

  console.error(formatArchitectureViolations(violations))
  process.exitCode = 1
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main()
}
