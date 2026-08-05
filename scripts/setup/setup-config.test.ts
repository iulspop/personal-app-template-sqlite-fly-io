import { describe, expect, test } from "vitest"

import { parseSetupConfig } from "./setup-config"

const validConfig = {
  appName: "Acme Notes",
  description: "A focused notes workspace.",
  iconSource: "./brand/icon.svg",
  locale: "en-US",
  productionUrl: "https://notes.example.com",
  shortName: "Acme",
}

describe("setup config", () => {
  test("given valid interactive or JSON input, should return normalized values", () => {
    expect(
      parseSetupConfig({ ...validConfig, appName: " Acme Notes " }),
    ).toEqual(validConfig)
  })

  test("given an insecure production URL, should reject it", () => {
    expect(() =>
      parseSetupConfig({ ...validConfig, productionUrl: "http://example.com" }),
    ).toThrow("Production URL must use HTTPS")
  })

  test("given an install short name that is too long, should reject it", () => {
    expect(() =>
      parseSetupConfig({ ...validConfig, shortName: "A very long app name" }),
    ).toThrow()
  })
})
