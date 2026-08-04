import { describe, expect, test } from "vitest"

import { createMonitoringConfig } from "./monitoring"

describe("createMonitoringConfig()", () => {
  test("given: no Sentry DSN, should: disable monitoring", () => {
    expect(
      createMonitoringConfig({
        dsn: undefined,
        environment: "production",
        release: undefined,
        tracesSampleRate: undefined,
      }),
    ).toEqual({
      dsn: "",
      environment: "production",
      isEnabled: false,
      release: undefined,
      tracesSampleRate: 0.1,
    })
  })

  test("given: configured Sentry values, should: enable monitoring", () => {
    expect(
      createMonitoringConfig({
        dsn: "https://public@example.ingest.sentry.io/1",
        environment: "staging",
        release: "app@abc123",
        tracesSampleRate: "0.25",
      }),
    ).toEqual({
      dsn: "https://public@example.ingest.sentry.io/1",
      environment: "staging",
      isEnabled: true,
      release: "app@abc123",
      tracesSampleRate: 0.25,
    })
  })

  test("given: an invalid sample rate, should: use the safe default", () => {
    expect(
      createMonitoringConfig({
        dsn: "https://public@example.ingest.sentry.io/1",
        environment: undefined,
        release: undefined,
        tracesSampleRate: "2",
      }).tracesSampleRate,
    ).toBe(0.1)
  })
})
