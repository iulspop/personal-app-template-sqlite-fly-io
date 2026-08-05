import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"

import { checkFeatures } from "../doctor/check-features"
import { parseSetupConfig } from "../setup/setup-config"
import { loadFeatureManifests } from "./load-feature-manifests"
import { planFeatureSelection } from "./plan-feature-selection"
import { prepareFeatureSelection } from "./prepare-feature-selection"

const fixtures: string[] = []

const manifest = {
  capabilities: ["clientWorkflows"],
  checks: ["pnpm exec vitest run app/features/reports"],
  conflicts: [],
  defaultEnabled: false,
  dependencies: [],
  description: "Fixture reports feature",
  docs: ["README.md"],
  envKeys: ["REPORTS_API_KEY"],
  id: "reports",
  migrations: ["prisma/migrations/001_reports"],
  name: "Reports",
  ownedPaths: ["app/features/reports", "app/routes/reports.tsx"],
  packages: {
    dependencies: ["reports-client"],
    devDependencies: [],
    scripts: ["reports:sync"],
  },
  prisma: { schemaSlots: ["reportsModel"] },
  routes: ["app/routes/reports.tsx"],
  sourceSlots: [
    { contribution: "reportsNavigation", slot: "primaryNavigation" },
  ],
}

const createFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), "feature-extensibility-"))
  fixtures.push(root)
  await Promise.all(
    [
      "app/composition",
      "app/features/reports",
      "app/routes",
      "prisma/migrations/001_reports",
      "scripts/features/manifests",
    ].map((path) => mkdir(join(root, path), { recursive: true })),
  )
  await Promise.all([
    writeFile(join(root, "app/features/reports/index.ts"), "export {}\n"),
    writeFile(join(root, "app/routes/reports.tsx"), "export {}\n"),
    writeFile(
      join(root, "app/composition/navigation.ts"),
      "// FEATURE_SLOT_BEGIN:primaryNavigation:reportsNavigation\nreports\n// FEATURE_SLOT_END:primaryNavigation:reportsNavigation\n",
    ),
    writeFile(
      join(root, "prisma/schema.prisma"),
      "// FEATURE_SLOT_BEGIN:prisma:reportsModel\nmodel Report { id String @id }\n// FEATURE_SLOT_END:prisma:reportsModel\n",
    ),
    writeFile(
      join(root, "package.json"),
      `${JSON.stringify({ dependencies: { "reports-client": "1.0.0" }, devDependencies: {}, scripts: { "reports:sync": "reports sync" } }, null, 2)}\n`,
    ),
    writeFile(join(root, "README.md"), "Reports docs\n"),
    writeFile(
      join(root, "scripts/features/manifests/reports-feature.ts"),
      `export default ${JSON.stringify(manifest)}`,
    ),
    writeFile(
      join(root, "prisma/migrations/001_reports/migration.sql"),
      "CREATE TABLE Report (id TEXT PRIMARY KEY);\n",
    ),
  ])
  return root
}

afterEach(async () => {
  await Promise.all(
    fixtures
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true })),
  )
})

describe("feature manifest extensibility", () => {
  test("given: a newly discovered feature manifest, should: flow through configuration, planning, preparation, and doctor without feature-specific branches", async () => {
    const root = await createFixture()
    const manifests = await loadFeatureManifests({
      directory: join(root, "scripts/features/manifests"),
    })
    const config = parseSetupConfig(
      {
        appName: "Fixture",
        description: "Fixture app",
        features: { reports: false },
        iconSource: "icon.svg",
        locale: "en",
        productionUrl: "https://example.com",
        shortName: "Fixture",
      },
      { featureManifests: manifests, requireFeatureSelections: true },
    )
    const plan = planFeatureSelection({
      features: config.features,
      manifests,
    })
    const edits = await prepareFeatureSelection({ plan, root })
    const findings = await checkFeatures({ manifests, projectRoot: root })
    const packageEdit = edits.find(({ path }) => path === "package.json")
    const schemaEdit = edits.find(({ path }) => path === "prisma/schema.prisma")
    const navigationEdit = edits.find(
      ({ path }) => path === "app/composition/navigation.ts",
    )

    expect(manifests.map(({ id }) => id)).toEqual(["reports"])
    expect(plan).toEqual(
      expect.objectContaining({
        deletions: [
          "app/features/reports",
          "app/routes/reports.tsx",
          "prisma/migrations/001_reports",
        ],
        envKeysToRemove: ["REPORTS_API_KEY"],
        prismaSlotsToRemove: ["reportsModel"],
        removedCapabilities: ["clientWorkflows"],
        removedFeatureIds: ["reports"],
      }),
    )
    expect(packageEdit?.content).not.toContain("reports-client")
    expect(packageEdit?.content).not.toContain("reports:sync")
    expect(schemaEdit?.content).not.toContain("model Report")
    expect(navigationEdit?.content).not.toContain("reportsNavigation")
    expect(findings).toContainEqual(
      expect.objectContaining({ id: "reports:retained", status: "pass" }),
    )
    expect(await readFile(join(root, "package.json"), "utf8")).toContain(
      "reports-client",
    )
  })
})
