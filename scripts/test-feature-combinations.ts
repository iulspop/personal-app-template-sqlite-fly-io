import { execFile } from "node:child_process"
import { access, cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { promisify } from "node:util"

import type { FeatureManifest } from "./features/feature-manifest"
import { loadFeatureManifests } from "./features/load-feature-manifests"
import { planFeatureSelection } from "./features/plan-feature-selection"

const execFileAsync = promisify(execFile)

export const createFeatureSelections = (manifests: FeatureManifest[]) =>
  Array.from({ length: 2 ** manifests.length }, (_, combination) =>
    Object.fromEntries(
      manifests.map(({ id }, index) => [
        id,
        Boolean(combination & (1 << index)),
      ]),
    ),
  ).filter((features) =>
    manifests.every(
      ({ conflicts, dependencies, id }) =>
        !features[id] ||
        (dependencies.every((dependency) => features[dependency]) &&
          conflicts.every((conflict) => !features[conflict])),
    ),
  )

const run = async ({
  args,
  command,
  cwd,
  env = {},
}: {
  args: string[]
  command: string
  cwd: string
  env?: Record<string, string>
}) => {
  console.log(`[features] ${command} ${args.join(" ")}`)
  await execFileAsync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    maxBuffer: 20 * 1024 * 1024,
  })
}

const copyProject = async ({
  root,
  target,
}: {
  root: string
  target: string
}) => {
  await cp(root, target, {
    filter: (source) => {
      const relativePath = source.slice(root.length + 1)
      return ![
        ".git",
        ".react-router",
        ".vite",
        "build",
        "node_modules",
        "prisma/dev.db",
        "prisma/dev.db-journal",
        "prisma/e2e.db",
        "prisma/test.db",
        "test-results",
      ].some(
        (ignored) =>
          relativePath === ignored || relativePath.startsWith(`${ignored}/`),
      )
    },
    recursive: true,
  })
}

const pathExists = async (path: string) =>
  access(path).then(
    () => true,
    () => false,
  )

const findPrismaModels = ({
  content,
  slot,
}: {
  content: string
  slot: string
}) => {
  const start = content.indexOf(`FEATURE_SLOT_BEGIN:prisma:${slot}`)
  const end = content.indexOf(`FEATURE_SLOT_END:prisma:${slot}`)
  if (start < 0 || end < 0) return []
  return [...content.slice(start, end).matchAll(/\bmodel\s+(\w+)/g)].map(
    ([, name]) => name,
  )
}

const assertNoMatches = async ({
  label,
  patterns,
  root,
}: {
  label: string
  patterns: string[]
  root: string
}) => {
  for (const pattern of patterns) {
    const matches = await execFileAsync(
      "rg",
      [
        "--files-with-matches",
        "--fixed-strings",
        pattern,
        "app",
        "README.md",
        "prisma/schema.prisma",
      ],
      { cwd: root },
    ).then(
      ({ stdout }) => stdout.trim(),
      ({ code }) => (code === 1 ? "" : Promise.reject(new Error(String(code)))),
    )
    if (matches) throw new Error(`${label} remains for ${pattern}:\n${matches}`)
  }
}

const assertRemovedFeatures = async ({
  manifests,
  originalRoot,
  packageRemovals,
  root,
}: {
  manifests: FeatureManifest[]
  originalRoot: string
  packageRemovals: string[]
  root: string
}) => {
  const packageJson = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  )
  const originalSchema = await readFile(
    join(originalRoot, "prisma/schema.prisma"),
    "utf8",
  )
  const schema = await readFile(join(root, "prisma/schema.prisma"), "utf8")

  for (const path of manifests.flatMap(({ migrations, ownedPaths, routes }) => [
    ...ownedPaths,
    ...routes,
    ...migrations,
  ]))
    if (await pathExists(join(root, path)))
      throw new Error(`Removed feature path remains: ${path}`)

  for (const name of packageRemovals)
    if (
      packageJson.dependencies?.[name] ||
      packageJson.devDependencies?.[name] ||
      packageJson.scripts?.[name]
    )
      throw new Error(`Removed package resource remains: ${name}`)

  for (const manifest of manifests) {
    const models = manifest.prisma.schemaSlots.flatMap((slot) =>
      findPrismaModels({ content: originalSchema, slot }),
    )
    models.forEach((model) => {
      if (schema.includes(`model ${model}`))
        throw new Error(`Removed Prisma model remains: ${model}`)
    })
    await assertNoMatches({
      label: "Removed feature environment key",
      patterns: manifest.envKeys,
      root,
    })
    await assertNoMatches({
      label: "Removed feature import",
      patterns: manifest.ownedPaths
        .filter((path) => path.startsWith("app/"))
        .map((path) => `~/${path.slice(4)}`),
      root,
    })
    for (const { contribution, slot } of manifest.sourceSlots)
      await assertNoMatches({
        label: "Removed source slot",
        patterns: [`FEATURE_SLOT_BEGIN:${slot}:${contribution}`],
        root,
      })
  }
}

const verifyCombination = async ({
  features,
  manifests,
  root,
}: {
  features: Record<string, boolean>
  manifests: FeatureManifest[]
  root: string
}) => {
  const label =
    manifests
      .filter(({ id }) => features[id])
      .map(({ id }) => id)
      .join("+") || "core"
  const target = await mkdtemp(join(tmpdir(), `feature-combination-${label}-`))
  console.log(`[features] verifying ${label}`)
  try {
    await copyProject({ root, target })
    await run({
      args: ["install", "--ignore-scripts", "--frozen-lockfile"],
      command: "pnpm",
      cwd: target,
    })
    const configPath = join(target, "feature-setup.json")
    await writeFile(
      configPath,
      `${JSON.stringify(
        {
          appName: "Feature Test",
          description: "Feature combination verification",
          features,
          iconSource: "public/icons/app-icon-source.svg",
          locale: "en",
          productionUrl: "https://example.com",
          shortName: "FeatureTest",
        },
        null,
        2,
      )}\n`,
    )
    await run({
      args: [
        "exec",
        "tsx",
        "scripts/setup.ts",
        "--non-interactive",
        "--force-feature-removal",
        "--config",
        configPath,
      ],
      command: "pnpm",
      cwd: target,
    })
    await rm(join(target, "node_modules"), { force: true, recursive: true })
    await run({
      args: ["install", "--ignore-scripts", "--no-frozen-lockfile"],
      command: "pnpm",
      cwd: target,
    })
    await run({
      args: ["rebuild", "better-sqlite3"],
      command: "pnpm",
      cwd: target,
    })
    const databaseUrl = `file:${join(target, "prisma/feature-test.db")}`
    await run({
      args: ["exec", "prisma", "migrate", "deploy"],
      command: "pnpm",
      cwd: target,
      env: { DATABASE_URL: databaseUrl },
    })
    await run({
      args: ["exec", "prisma", "generate"],
      command: "pnpm",
      cwd: target,
      env: { DATABASE_URL: databaseUrl },
    })
    await run({ args: ["check:architecture"], command: "pnpm", cwd: target })
    await run({ args: ["typecheck"], command: "pnpm", cwd: target })
    for (const check of manifests
      .filter(({ id }) => features[id])
      .flatMap(({ checks }) => checks)) {
      await run({
        args: ["-lc", check],
        command: "sh",
        cwd: target,
        env: { DATABASE_URL: databaseUrl },
      })
    }
    await run({ args: ["build"], command: "pnpm", cwd: target })
    const plan = planFeatureSelection({ features, manifests })
    await assertRemovedFeatures({
      manifests: manifests.filter(({ id }) => !features[id]),
      originalRoot: root,
      packageRemovals: [
        ...plan.packageChanges.dependencies.remove,
        ...plan.packageChanges.devDependencies.remove,
        ...plan.packageChanges.scripts.remove,
      ],
      root: target,
    })
  } finally {
    await rm(target, { force: true, recursive: true })
  }
}

export const verifyFeatureCombinations = async ({
  manifests,
  root = process.cwd(),
}: {
  manifests?: FeatureManifest[]
  root?: string
} = {}) => {
  const discovered =
    manifests ??
    (await loadFeatureManifests({
      directory: resolve(root, "scripts/features/manifests"),
    }))
  for (const features of createFeatureSelections(discovered))
    await verifyCombination({ features, manifests: discovered, root })
}

if (import.meta.url === new URL(process.argv[1] ?? "", "file:").href)
  await verifyFeatureCombinations()
