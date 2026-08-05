import { readdir, readFile } from "node:fs/promises"
import { extname, relative, resolve } from "node:path"

import type { FeatureSelectionEdit } from "./apply-feature-selection"
import type { FeatureSelectionPlan } from "./plan-feature-selection"
import { removePrismaSchemaSlots } from "./prisma-feature-history"
import { listSourceSlots, removeSourceSlot } from "./source-slots"

const ignoredDirectories = new Set([
  ".git",
  ".react-router",
  ".vite",
  "build",
  "node_modules",
  "test-results",
])
const sourceExtensions = new Set([".md", ".prisma", ".ts", ".tsx"])

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

const removePackageDependencies = ({
  content,
  plan,
}: {
  content: string
  plan: FeatureSelectionPlan
}) => {
  const packageJson = JSON.parse(content) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
  }
  const remove = (section: "dependencies" | "devDependencies") => {
    const dependencies = packageJson[section]
    plan.packageChanges[section].remove.forEach((name) => {
      if (dependencies) delete dependencies[name]
    })
  }
  remove("dependencies")
  remove("devDependencies")
  plan.packageChanges.scripts.remove.forEach((name) => {
    if (packageJson.scripts) delete packageJson.scripts[name]
  })
  return `${JSON.stringify(packageJson, null, 2)}\n`
}

export const prepareFeatureSelection = async ({
  plan,
  root = process.cwd(),
}: {
  plan: FeatureSelectionPlan
  root?: string
}): Promise<FeatureSelectionEdit[]> => {
  const files = await listSourceFiles(root)
  const originals = new Map(
    await Promise.all(
      files.map(async (path) => [path, await readFile(path, "utf8")] as const),
    ),
  )
  const contents = new Map(originals)

  plan.sourceSlotsToRemove.forEach(({ contribution, slot }) => {
    const matches = [...contents].filter(([, content]) =>
      listSourceSlots(content).some(
        (sourceSlot) =>
          sourceSlot.slot === slot && sourceSlot.contribution === contribution,
      ),
    )
    if (matches.length !== 1)
      throw new Error(
        `Expected exactly one source slot "${slot}:${contribution}" across the project`,
      )
    const [[path, content]] = matches
    contents.set(path, removeSourceSlot({ content, contribution, slot }))
  })

  const schemaPath = resolve(root, "prisma/schema.prisma")
  if (plan.prismaSlotsToRemove.length > 0) {
    const schema =
      contents.get(schemaPath) ?? (await readFile(schemaPath, "utf8"))
    contents.set(
      schemaPath,
      removePrismaSchemaSlots({
        content: schema,
        slots: plan.prismaSlotsToRemove,
      }),
    )
  }

  const packagePath = resolve(root, "package.json")
  const originalPackage = await readFile(packagePath, "utf8")
  const nextPackage = removePackageDependencies({
    content: originalPackage,
    plan,
  })
  if (nextPackage !== originalPackage) contents.set(packagePath, nextPackage)

  return [...contents]
    .filter(([path, content]) => content !== originals.get(path))
    .map(([path, content]) => ({ content, path: relative(root, path) }))
    .filter(
      ({ path }) =>
        !plan.deletions.some(
          (deletion) => path === deletion || path.startsWith(`${deletion}/`),
        ),
    )
    .sort(({ path: left }, { path: right }) => left.localeCompare(right))
}
