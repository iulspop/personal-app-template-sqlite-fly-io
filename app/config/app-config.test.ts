import { describe, expect, test } from "vitest"

import { appConfig } from "./app-config"

const hexColorPattern = /^#[0-9a-f]{6}$/i
const rootRelativeUrlPattern = /^\/(?!\/)/

function parseSquareSize(size: string) {
  const [width, height] = size.split("x").map(Number)
  return { height, width }
}

describe("appConfig", () => {
  test("given: application identity, should: define required install values", () => {
    expect(appConfig.name).not.toBe("")
    expect(appConfig.shortName).not.toBe("")
    expect(appConfig.description).not.toBe("")
    expect(appConfig.locale).not.toBe("")
    expect(appConfig.display).toBe("standalone")
    expect(appConfig.startUrl).toMatch(rootRelativeUrlPattern)
    expect(appConfig.scope).toMatch(rootRelativeUrlPattern)
  })

  test("given: application colors, should: use six-digit hex values", () => {
    expect(appConfig.backgroundColor).toMatch(hexColorPattern)
    expect(appConfig.themeColor.light).toMatch(hexColorPattern)
    expect(appConfig.themeColor.dark).toMatch(hexColorPattern)
  })

  test("given: install icons, should: define unique square PNG assets", () => {
    expect(new Set(appConfig.icons.map(({ src }) => src)).size).toBe(
      appConfig.icons.length,
    )

    for (const icon of appConfig.icons) {
      const { height, width } = parseSquareSize(icon.sizes)

      expect(icon.src).toMatch(rootRelativeUrlPattern)
      expect(icon.type).toBe("image/png")
      expect(width).toBeGreaterThanOrEqual(192)
      expect(width).toBe(height)
    }

    expect(appConfig.icons.some(({ purpose }) => purpose === "maskable")).toBe(
      true,
    )
    expect(appConfig.icons.some(({ sizes }) => sizes === "512x512")).toBe(true)
  })
})
