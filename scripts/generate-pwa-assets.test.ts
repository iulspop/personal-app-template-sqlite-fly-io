import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"

import { createPwaAssetEdits } from "./generate-pwa-assets"

const fixtures: string[] = []

afterEach(async () => {
  await Promise.all(
    fixtures
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true })),
  )
})

describe("createPwaAssetEdits()", () => {
  test("given: an SVG icon, should: generate every PWA asset in memory", async () => {
    const root = await mkdtemp(join(tmpdir(), "pwa-assets-"))
    fixtures.push(root)
    const sourcePath = join(root, "icon.svg")
    await writeFile(
      sourcePath,
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#11100f"/></svg>',
    )

    const actual = await createPwaAssetEdits({ sourcePath })
    const expectedPaths = [
      "public/apple-touch-icon.png",
      "public/icons/pwa-192x192.png",
      "public/icons/pwa-512x512.png",
      "public/icons/pwa-maskable-512x512.png",
    ]

    expect(actual.map(({ path }) => path)).toEqual(expectedPaths)
    expect(actual.every(({ content }) => content.length > 0)).toEqual(true)
    expect(await readFile(sourcePath, "utf8")).toContain("<svg")
  })
})
