import { afterEach, describe, expect, test, vi } from "vitest"

import {
  getServerEnv,
  parseServerEnv,
  resetServerEnvCacheForTests,
  ServerEnvValidationError,
} from "./server-env.server"

afterEach(() => {
  resetServerEnvCacheForTests()
  vi.unstubAllEnvs()
})

describe("parseServerEnv", () => {
  test("given: development mode, should: preserve existing safe defaults", () => {
    expect(parseServerEnv({}, "development")).toMatchObject({
      ALLOW_INDEXING: true,
      CHAT_ATTACHMENT_DIRECTORY: expect.stringMatching(
        /\.data\/chat-attachments$/,
      ),
      DATABASE_URL: "file:./prisma/dev.db",
      EMAIL_FROM: "noreply@example.com",
      NODE_ENV: "development",
      SESSION_SECRET: "default-secret",
    })
  })

  test("given: production mode, should: require explicit core configuration", () => {
    expect(() => parseServerEnv({}, "production")).toThrow(
      ServerEnvValidationError,
    )
  })

  test("given: invalid secret values, should: expose redacted issues only", () => {
    const secret = "secret-that-must-stay-private"

    try {
      parseServerEnv(
        {
          APP_URL: secret,
          DATABASE_URL: "file:./prisma/prod.db",
          SESSION_SECRET: secret,
        },
        "production",
      )
      throw new Error("Expected environment validation to fail")
    } catch (error) {
      expect(error).toBeInstanceOf(ServerEnvValidationError)
      expect(JSON.stringify(error)).not.toContain(secret)
      expect((error as ServerEnvValidationError).issues).toEqual([
        expect.objectContaining({ path: "APP_URL" }),
      ])
    }
  })
})

describe("getServerEnv", () => {
  test("given: repeated access, should: cache the parsed environment", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("DATABASE_URL", "file:./prisma/first.db")

    const first = getServerEnv()
    vi.stubEnv("DATABASE_URL", "file:./prisma/second.db")
    const second = getServerEnv()

    expect(second).toBe(first)
    expect(second.DATABASE_URL).toBe("file:./prisma/first.db")
  })

  test("given: an unsupported runtime mode, should: use development defaults", () => {
    vi.stubEnv("NODE_ENV", "preview")

    expect(getServerEnv().NODE_ENV).toBe("development")
  })
})
