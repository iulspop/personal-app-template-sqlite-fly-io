import { execFile } from "node:child_process"
import { relative, resolve } from "node:path"
import { promisify } from "node:util"

import type { FeatureSelectionEdit } from "./apply-feature-selection"
import type { FeatureSelectionPlan } from "./plan-feature-selection"

const execFileAsync = promisify(execFile)

const isWithinPath = (path: string, parent: string) =>
  path === parent || path.startsWith(`${parent}/`)

const listChangedTrackedPaths = async (root: string) => {
  const { stdout } = await execFileAsync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=no"],
    { cwd: root },
  )

  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3))
    .flatMap((path) => path.split(" -> ").slice(-1))
    .sort()
}

export const assertSafeTrackedFeatureRemoval = async ({
  edits,
  force = false,
  plan,
  root = process.cwd(),
}: {
  edits: FeatureSelectionEdit[]
  force?: boolean
  plan: FeatureSelectionPlan
  root?: string
}) => {
  if (force || plan.removedFeatureIds.length === 0) return

  const operationPaths = [...plan.deletions, ...edits.map(({ path }) => path)]
  const changedPaths = await listChangedTrackedPaths(root)
  const unrelatedPaths = changedPaths.filter(
    (path) =>
      !operationPaths.some((operation) => isWithinPath(path, operation)),
  )

  if (unrelatedPaths.length > 0)
    throw new Error(
      `Refusing feature removal with unrelated tracked changes:\n${unrelatedPaths
        .map((path) => `- ${relative(root, resolve(root, path))}`)
        .join("\n")}\nCommit, stash, or pass --force-feature-removal.`,
    )
}
