import { afterEach, describe, expect, test, vi } from "vitest"

const sendEmail = vi.fn()

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: sendEmail },
  })),
}))

describe("sendOwnerChatEmail()", () => {
  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.resetModules()
    sendEmail.mockReset()
    const { resetServerEnvCacheForTests } = await import(
      "../../../config/server-env.server"
    )
    resetServerEnvCacheForTests()
  })

  test("given: development with Resend configured, should: skip email delivery", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("RESEND_API_KEY", "re_test_key")
    const { resetServerEnvCacheForTests } = await import(
      "../../../config/server-env.server"
    )
    resetServerEnvCacheForTests()
    const { sendOwnerChatEmail } = await import("./chat-email.server")

    const actual = await sendOwnerChatEmail({
      dashboardUrl: "http://localhost:5250/owner/chats",
      recipientEmail: "owner@example.com",
      senderEmail: "user@example.com",
    })
    const expected = {
      delivered: false,
      errorCode: "EMAIL_DISABLED_IN_DEVELOPMENT",
    }

    expect(actual).toEqual(expected)
    expect(sendEmail.mock.calls).toEqual([])
  })
})
