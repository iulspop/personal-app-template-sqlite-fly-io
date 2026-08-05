import { describe, expect, test } from "vitest"

import { parseSetupConfig } from "./setup-config"

const featureManifests = [
  {
    defaultEnabled: true,
    dependencies: [],
    description: "Task management",
    id: "todos",
    name: "Todos",
  },
  {
    defaultEnabled: false,
    dependencies: [],
    description: "Founder messaging",
    id: "founderChat",
    name: "Founder chat",
  },
]

const validConfig = {
  appName: "Acme Notes",
  description: "A focused notes workspace.",
  features: {},
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

  test("given discovered features, should accept an explicit selection for each feature", () => {
    const actual = parseSetupConfig(
      {
        ...validConfig,
        features: { founderChat: false, todos: true },
      },
      { featureManifests, requireFeatureSelections: true },
    )
    const expected = {
      ...validConfig,
      features: { founderChat: false, todos: true },
    }

    expect(actual).toEqual(expected)
  })

  test("given an unknown feature ID, should reject the setup config", () => {
    expect(() =>
      parseSetupConfig(
        {
          ...validConfig,
          features: { founderChat: false, todos: true, unknownFeature: true },
        },
        { featureManifests, requireFeatureSelections: true },
      ),
    ).toThrow('Unknown feature selection "unknownFeature"')
  })

  test("given non-interactive config missing a discovered feature, should reject it", () => {
    expect(() =>
      parseSetupConfig(
        { ...validConfig, features: { todos: true } },
        { featureManifests, requireFeatureSelections: true },
      ),
    ).toThrow('Missing feature selection "founderChat"')
  })

  test("given interactive defaults, should derive selections from discovered manifests", () => {
    const { features: _, ...configWithoutFeatures } = validConfig
    const actual = parseSetupConfig(configWithoutFeatures, { featureManifests })
    const expected = {
      ...validConfig,
      features: { founderChat: false, todos: true },
    }

    expect(actual).toEqual(expected)
  })
})
