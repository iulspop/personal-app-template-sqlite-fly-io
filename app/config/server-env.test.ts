import { describe, expect, test } from "vitest"

import { createServerEnvSchema, redactEnvIssues } from "./server-env"

describe("createServerEnvSchema", () => {
  test("given: development configuration, should: parse optional integrations", () => {
    const result = createServerEnvSchema("development").parse({
      ALLOW_INDEXING: "false",
      APP_URL: "http://localhost:5250",
      POSTHOG_API_HOST: "https://us.i.posthog.com",
      SENTRY_TRACES_SAMPLE_RATE: "0.25",
    })

    expect(result).toMatchObject({
      ALLOW_INDEXING: false,
      APP_URL: "http://localhost:5250",
      POSTHOG_API_HOST: "https://us.i.posthog.com",
      SENTRY_TRACES_SAMPLE_RATE: 0.25,
    })
  })

  test("given: production configuration, should: require core runtime values", () => {
    const result = createServerEnvSchema("production").safeParse({})

    expect(result.success).toBe(false)
    if (result.success) return

    expect(redactEnvIssues(result.error)).toEqual([
      {
        code: "custom",
        message: "Required in production",
        path: "APP_URL",
      },
      {
        code: "custom",
        message: "Required in production",
        path: "DATABASE_URL",
      },
      {
        code: "custom",
        message: "Required in production",
        path: "SESSION_SECRET",
      },
    ])
  })

  test("given: optional providers, should: require complete provider configuration", () => {
    const result = createServerEnvSchema("development").safeParse({
      RESEND_API_KEY: "resend-secret",
      TWILIO_ACCOUNT_SID: "twilio-account",
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(redactEnvIssues(result.error)).toEqual([
      {
        code: "custom",
        message: "Required when Resend is configured",
        path: "EMAIL_FROM",
      },
      {
        code: "custom",
        message: "Required when Twilio is partially configured",
        path: "TWILIO_AUTH_TOKEN",
      },
      {
        code: "custom",
        message: "Required when Twilio is partially configured",
        path: "TWILIO_FROM_NUMBER",
      },
    ])
  })

  test("given: invalid secret-bearing input, should: redact the supplied values", () => {
    const secret = "must-not-appear"
    const result = createServerEnvSchema("production").safeParse({
      APP_URL: secret,
      DATABASE_URL: "file:./prisma/prod.db",
      SENTRY_TRACES_SAMPLE_RATE: secret,
      SESSION_SECRET: secret,
    })

    expect(result.success).toBe(false)
    if (result.success) return

    const issues = redactEnvIssues(result.error)
    expect(JSON.stringify(issues)).not.toContain(secret)
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "APP_URL" }),
        expect.objectContaining({ path: "SENTRY_TRACES_SAMPLE_RATE" }),
      ]),
    )
  })

  test("given: empty optional values, should: normalize them to undefined", () => {
    const result = createServerEnvSchema("test").parse({
      OWNER_EMAIL_ALLOWLIST: "  ",
      POSTHOG_API_KEY: "",
      SENTRY_DSN: "",
    })

    expect(result).toMatchObject({
      OWNER_EMAIL_ALLOWLIST: undefined,
      POSTHOG_API_KEY: undefined,
      SENTRY_DSN: undefined,
    })
  })
})

describe("redactEnvIssues", () => {
  test("given: validation errors, should: expose only path, code, and message", () => {
    const result = createServerEnvSchema("development").safeParse({
      APP_URL: "not-a-url",
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(redactEnvIssues(result.error)).toEqual([
      {
        code: "custom",
        message: "Must be an HTTP or HTTPS URL",
        path: "APP_URL",
      },
    ])
  })
})
