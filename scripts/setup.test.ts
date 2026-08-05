import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test, vi } from "vitest"

import { parseSetupArguments, runSetup } from "./setup"

const fixtures: string[] = []

async function createFixture(config: Record<string, unknown>) {
  const root = await mkdtemp(join(tmpdir(), "app-setup-"))
  fixtures.push(root)
  await mkdir(join(root, "brand"), { recursive: true })
  await writeFile(
    join(root, "brand/icon.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg"/>',
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
  test("given CLI flags, should parse non-interactive dry-run options", () => {
    expect(
      parseSetupArguments([
        "--dry-run",
        "--non-interactive",
        "--config",
        "setup.json",
      ]),
    ).toEqual({
      configPath: "setup.json",
      dryRun: true,
      nonInteractive: true,
    })
  })

  test("given a valid config dry run, should not mutate the fixture", async () => {
    const root = await createFixture({
      appName: "Acme",
      description: "Acme workspace",
      iconSource: "brand/icon.svg",
      locale: "en-US",
      productionUrl: "https://acme.example.com",
      shortName: "Acme",
    })
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined)

    await runSetup({
      configPath: "setup.json",
      dryRun: true,
      nonInteractive: true,
      projectRoot: root,
    })

    expect(log).toHaveBeenCalledWith("Dry run: no files changed.")
  })

  test("given non-interactive mode without config, should reject it", async () => {
    await expect(
      runSetup({ dryRun: true, nonInteractive: true }),
    ).rejects.toThrow("--non-interactive requires --config")
  })
})
