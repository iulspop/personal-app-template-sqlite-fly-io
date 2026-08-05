import { describe, expect, test } from "vitest"

import { updateAppConfigSource } from "./update-app-config"

const config = {
  appName: "Acme Notes",
  description: "A focused notes workspace.",
  iconSource: "./brand/icon.svg",
  locale: "en-US",
  productionUrl: "https://notes.example.com",
  shortName: "Acme",
}

const source = `export type AppConfig = { readonly name: string }

export const appConfig = {
  name: "Personal App",
} as const satisfies AppConfig
`

describe("app config updater", () => {
  test("given the canonical declaration, should update only configurable identity", () => {
    const actual = updateAppConfigSource(source, config)

    expect(actual).toContain('name: "Acme Notes"')
    expect(actual).toContain('shortName: "Acme"')
    expect(actual).toContain('locale: "en-US"')
    expect(actual).toContain("export type AppConfig")
  })

  test("given the generated output again, should be idempotent", () => {
    const updated = updateAppConfigSource(source, config)
    expect(updateAppConfigSource(updated, config)).toBe(updated)
  })

  test("given an ambiguous source, should reject it", () => {
    expect(() =>
      updateAppConfigSource("export const value = {}", config),
    ).toThrow("Expected exactly one canonical appConfig declaration")
  })
})
