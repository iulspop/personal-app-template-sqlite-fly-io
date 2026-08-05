import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test, vi } from "vitest"

import founderChatFeature from "./features/manifests/founder-chat-feature"
import todosFeature from "./features/manifests/todos-feature"
import { formatFeaturePrompt, parseSetupArguments, runSetup } from "./setup"

const manifests = [founderChatFeature, todosFeature]

const fixtures: string[] = []

async function createFixture(config: Record<string, unknown>) {
  const root = await mkdtemp(join(tmpdir(), "app-setup-"))
  fixtures.push(root)
  await Promise.all([
    mkdir(join(root, "app/config"), { recursive: true }),
    mkdir(join(root, "brand"), { recursive: true }),
  ])
  await writeFile(
    join(root, "brand/icon.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#11100f"/></svg>',
  )
  await writeFile(
    join(root, "app/config/app-config.ts"),
    'type AppConfig = Record<string, unknown>\nexport const appConfig = {\n  name: "Starter",\n} as const satisfies AppConfig\n',
  )
  await writeFile(join(root, "setup.json"), JSON.stringify(config))
  return root
}

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(
    fixtures
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true })),
  )
})

describe("setup CLI", () => {
  test("given: feature relationships, should: include dependencies and conflicts in the prompt", () => {
    const actual = formatFeaturePrompt({
      ...todosFeature,
      conflicts: ["legacyTodos"],
      dependencies: ["accounts"],
    })
    const expected =
      "Include Todos? Todo management, filtering, and the authenticated home workspace. Dependencies: accounts. Conflicts: legacyTodos. [Y/n] "

    expect(actual).toEqual(expected)
  })

  test("given CLI flags, should parse non-interactive dry-run options", () => {
    expect(
      parseSetupArguments([
        "--dry-run",
        "--non-interactive",
        "--config",
        "setup.json",
        "--force-feature-removal",
      ]),
    ).toEqual({
      configPath: "setup.json",
      dryRun: true,
      forceFeatureRemoval: true,
      nonInteractive: true,
    })
  })

  test("given a valid config dry run, should not mutate the fixture", async () => {
    const root = await createFixture({
      appName: "Acme",
      description: "Acme workspace",
      features: { founderChat: true, todos: true },
      iconSource: "brand/icon.svg",
      locale: "en-US",
      productionUrl: "https://acme.example.com",
      shortName: "Acme",
    })
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined)

    await runSetup({
      configPath: "setup.json",
      dryRun: true,
      manifests,
      nonInteractive: true,
      projectRoot: root,
    })

    const actual = log.mock.calls.map(([message]) => message)
    const expectedWrites = [
      "Write: app/config/app-config.ts",
      "Write: public/icons/app-icon-source.svg",
      "Write: public/apple-touch-icon.png",
      "Write: public/icons/pwa-192x192.png",
      "Write: public/icons/pwa-512x512.png",
      "Write: public/icons/pwa-maskable-512x512.png",
    ]

    expect(actual).toEqual(expect.arrayContaining(expectedWrites))
    expect(actual).toContain("Dry run: no files changed.")
  })

  test("given non-interactive mode without config, should reject it", async () => {
    await expect(
      runSetup({ dryRun: true, nonInteractive: true }),
    ).rejects.toThrow("--non-interactive requires --config")
  })
})
