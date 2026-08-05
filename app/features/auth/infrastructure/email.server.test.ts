import { afterEach, describe, expect, test, vi } from "vitest"

import { logMagicLinkEmail, logVerificationEmail } from "./email.server"

describe("logMagicLinkEmail()", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("given: a magic link email, should: log the code and link", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined)

    logMagicLinkEmail({
      code: "123456",
      email: "user@example.com",
      magicLinkUrl:
        "http://localhost:5173/auth/callback?type=login&target=user%40example.com&code=123456",
    })

    const actual = log.mock.calls
    const expected = [
      ["[Auth] Magic link for user@example.com:"],
      ["  Code: 123456"],
      [
        "  Link: http://localhost:5173/auth/callback?type=login&target=user%40example.com&code=123456",
      ],
    ]

    expect(actual).toEqual(expected)
  })
})

describe("logVerificationEmail()", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("given: a verification email, should: log the code and link", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined)

    logVerificationEmail({
      code: "654321",
      email: "user@example.com",
      verificationUrl:
        "http://localhost:5173/auth/callback?type=email-verification&target=user%40example.com&code=654321",
    })

    const actual = log.mock.calls
    const expected = [
      ["[Auth] Email verification for user@example.com:"],
      ["  Code: 654321"],
      [
        "  Link: http://localhost:5173/auth/callback?type=email-verification&target=user%40example.com&code=654321",
      ],
    ]

    expect(actual).toEqual(expected)
  })
})

describe("sendVerificationEmail()", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  test("given: production without Resend configured, should: log an error without logging the code", async () => {
    vi.stubEnv("APP_URL", "https://app.example.com")
    vi.stubEnv("DATABASE_URL", "file:./prisma/prod.db")
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("RESEND_API_KEY", "")
    vi.stubEnv("SESSION_SECRET", "test-production-session-secret")
    vi.resetModules()
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined)
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { sendVerificationEmail } = await import("./email.server")

    await sendVerificationEmail({
      code: "654321",
      email: "user@example.com",
      verificationUrl:
        "http://localhost:5173/auth/callback?type=email-verification&target=user%40example.com&code=654321",
    })

    const actualLogs = log.mock.calls
    const expectedLogs: string[][] = []
    const actualErrors = error.mock.calls
    const expectedErrors = [
      ["[Auth] RESEND_API_KEY is not configured; email was not sent."],
    ]

    expect(actualLogs).toEqual(expectedLogs)
    expect(actualErrors).toEqual(expectedErrors)
  })
})
