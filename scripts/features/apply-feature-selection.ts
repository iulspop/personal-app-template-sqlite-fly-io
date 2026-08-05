import { access, mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises"
import { dirname, relative, resolve } from "node:path"

import type { FeatureSelectionPlan } from "./plan-feature-selection"

export type FeatureSelectionEdit = {
  content: string | Uint8Array
  path: string
}

const resolveProjectPath = ({ path, root }: { path: string; root: string }) => {
  const resolved = resolve(root, path)
  if (relative(root, resolved).startsWith(".."))
    throw new Error(`Path escapes project root: "${path}"`)
  return resolved
}

const pathExists = async (path: string) =>
  access(path).then(
    () => true,
    () => false,
  )

const validateOperations = async ({
  deletions,
  edits,
  root,
}: {
  deletions: string[]
  edits: FeatureSelectionEdit[]
  root: string
}) => {
  const duplicateEdit = edits
    .map(({ path }) => path)
    .find((path, index, paths) => paths.indexOf(path) !== index)
  if (duplicateEdit) throw new Error(`Duplicate edit path "${duplicateEdit}"`)

  for (const { path } of edits) {
    const resolved = resolveProjectPath({ path, root })
    if (!(await pathExists(resolved)))
      throw new Error(`Cannot edit missing path "${path}"`)
    if (
      deletions.some(
        (deletion) => path === deletion || path.startsWith(`${deletion}/`),
      )
    )
      throw new Error(`Cannot edit deleted path "${path}"`)
  }

  for (const path of deletions) {
    const resolved = resolveProjectPath({ path, root })
    if (!(await pathExists(resolved)))
      throw new Error(`Cannot delete missing path "${path}"`)
  }
}

const move = async ({ from, to }: { from: string; to: string }) => {
  await mkdir(dirname(to), { recursive: true })
  await rename(from, to)
}

export const applyFeatureSelection = async ({
  dryRun = false,
  edits,
  onOperationApplied = () => {},
  plan,
  root = process.cwd(),
}: {
  dryRun?: boolean
  edits: FeatureSelectionEdit[]
  onOperationApplied?: () => void
  plan: FeatureSelectionPlan
  root?: string
}) => {
  const deletions = [...plan.deletions].sort()
  const sortedEdits = [...edits].sort(({ path: left }, { path: right }) =>
    left.localeCompare(right),
  )
  await validateOperations({ deletions, edits: sortedEdits, root })
  const result = {
    deleted: deletions,
    written: sortedEdits.map(({ path }) => path),
  }
  if (dryRun) return result

  const transactionRoot = await mkdtemp(resolve(root, ".feature-selection-"))
  const stagedRoot = resolve(transactionRoot, "staged")
  const backupRoot = resolve(transactionRoot, "backup")
  const movedDeletions: string[] = []
  const movedEdits: string[] = []
  const writtenEdits: string[] = []

  try {
    await Promise.all(
      sortedEdits.map(async ({ content, path }) => {
        const staged = resolve(stagedRoot, path)
        await mkdir(dirname(staged), { recursive: true })
        await writeFile(staged, content)
      }),
    )

    for (const path of deletions) {
      await move({
        from: resolveProjectPath({ path, root }),
        to: resolve(backupRoot, "deletions", path),
      })
      movedDeletions.push(path)
      onOperationApplied()
    }

    for (const { path } of sortedEdits) {
      const target = resolveProjectPath({ path, root })
      await move({ from: target, to: resolve(backupRoot, "edits", path) })
      movedEdits.push(path)
      onOperationApplied()
      await move({ from: resolve(stagedRoot, path), to: target })
      writtenEdits.push(path)
      onOperationApplied()
    }
  } catch (error) {
    await Promise.all(
      [...writtenEdits].reverse().map((path) =>
        rm(resolveProjectPath({ path, root }), {
          force: true,
          recursive: true,
        }),
      ),
    )
    for (const path of [...movedEdits].reverse())
      await move({
        from: resolve(backupRoot, "edits", path),
        to: resolveProjectPath({ path, root }),
      })
    for (const path of [...movedDeletions].reverse())
      await move({
        from: resolve(backupRoot, "deletions", path),
        to: resolveProjectPath({ path, root }),
      })
    await rm(transactionRoot, { force: true, recursive: true })
    throw error
  }

  await rm(transactionRoot, { force: true, recursive: true })
  return result
}
