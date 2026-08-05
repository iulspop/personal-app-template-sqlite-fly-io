import { access, readdir, readFile } from "node:fs/promises"
import { extname, resolve } from "node:path"

import type { FeatureManifest } from "../features/feature-manifest"
import { loadFeatureManifests } from "../features/load-feature-manifests"
import { listSourceSlots } from "../features/source-slots"
import type { DoctorFinding } from "./doctor-types"

const ignoredDirectories = new Set([
  ".git",
  ".react-router",
  ".vite",
  "build",
  "node_modules",
  "scripts",
  "test-results",
])
const sourceExtensions = new Set([".md", ".prisma", ".ts", ".tsx"])

const pathExists = async (path: string) =>
  access(path).then(
    () => true,
    () => false,
  )

const listSourceFiles = async (directory: string): Promise<string[]> =>
  (
    await Promise.all(
      (
        await readdir(directory, { withFileTypes: true })
      ).map(async (entry) => {
        if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return []
        const path = resolve(directory, entry.name)
        if (entry.isDirectory()) return await listSourceFiles(path)
        return sourceExtensions.has(extname(entry.name)) ? [path] : []
      }),
    )
  ).flat()

const countSourceSlots = async (projectRoot: string) => {
  const files = await listSourceFiles(projectRoot)
  const slots = (
    await Promise.all(
      files.map(async (path) => listSourceSlots(await readFile(path, "utf8"))),
    )
  ).flat()
  return slots.reduce<Record<string, number>>(
    (counts, { contribution, slot }) => {
      const key = `${slot}:${contribution}`
      return { ...counts, [key]: (counts[key] ?? 0) + 1 }
    },
    {},
  )
}

const featureState = async ({
  manifest,
  projectRoot,
}: {
  manifest: FeatureManifest
  projectRoot: string
}) => {
  const paths = await Promise.all(
    manifest.ownedPaths.map((path) => pathExists(resolve(projectRoot, path))),
  )
  if (paths.every(Boolean)) return "retained" as const
  if (paths.every((exists) => !exists)) return "removed" as const
  return "partial" as const
}

export const checkFeatures = async ({
  manifests,
  projectRoot = process.cwd(),
}: {
  manifests?: FeatureManifest[]
  projectRoot?: string
} = {}): Promise<DoctorFinding[]> => {
  const discovered =
    manifests ??
    (await loadFeatureManifests({
      directory: resolve(projectRoot, "scripts/features/manifests"),
    }))
  const sourceSlotCounts = await countSourceSlots(projectRoot)

  return (
    await Promise.all(
      discovered.map(async (manifest) => {
        const state = await featureState({ manifest, projectRoot })
        if (state === "partial")
          return [
            {
              category: "features",
              id: `${manifest.id}:partial`,
              message: `${manifest.name} is partially removed.`,
              remediation:
                "Restore the feature from Git or rerun setup from a fresh template clone.",
              status: "fail",
            } satisfies DoctorFinding,
          ]

        const expectedSlotCount = state === "retained" ? 1 : 0
        const invalidSlots = manifest.sourceSlots.filter(
          ({ contribution, slot }) =>
            (sourceSlotCounts[`${slot}:${contribution}`] ?? 0) !==
            expectedSlotCount,
        )
        const invalidMigrations = (
          await Promise.all(
            manifest.migrations.map(async (path) => ({
              exists: await pathExists(resolve(projectRoot, path)),
              path,
            })),
          )
        ).filter(({ exists }) => exists !== (state === "retained"))
        const findings: DoctorFinding[] = [
          {
            category: "features",
            id: `${manifest.id}:${state}`,
            message: `${manifest.name} is ${state}.`,
            status: "pass",
          },
        ]
        if (invalidSlots.length > 0)
          findings.push({
            category: "features",
            id: `${manifest.id}:source-slots`,
            message: `${manifest.name} has stale or missing source-slot contributions.`,
            remediation:
              "Restore the generated composition files or rerun setup from a fresh template clone.",
            status: "fail",
          })
        if (invalidMigrations.length > 0)
          findings.push({
            category: "features",
            id: `${manifest.id}:migrations`,
            message: `${manifest.name} has inconsistent migration ownership.`,
            remediation:
              "Restore or remove only the migrations declared by the feature manifest.",
            status: "fail",
          })
        return findings
      }),
    )
  ).flat()
}
