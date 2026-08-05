import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { verifyVerificationTOTP } from "../infrastructure/totp.server"
import { deleteVerificationFromDatabaseByTypeAndTarget } from "../infrastructure/verifications-model.server"
import { authAction } from "./auth-action.server"
import { createUserSession } from "./auth-session.server"
import {
  retrieveUserFromDatabaseByEmail,
  saveUserToDatabase,
  updateUserInDatabaseById,
} from "~/features/users/infrastructure/users-model.server"

vi.mock("./auth-session.server", () => ({
  createUserSession: vi.fn(() => "__session=user-session; Path=/; HttpOnly"),
}))

vi.mock("../infrastructure/totp.server", () => ({
  generateVerificationTOTP: vi.fn(),
  verifyVerificationTOTP: vi.fn(() => true),
}))

vi.mock("../infrastructure/verifications-model.server", () => ({
  deleteVerificationFromDatabaseByTypeAndTarget: vi.fn(),
  retrieveVerificationFromDatabaseByTypeAndTarget: vi.fn(() => ({
    algorithm: "SHA-1",
    charSet: "ABC123",
    digits: 6,
    expiresAt: new Date("2026-05-31T00:10:00.000Z"),
    period: 600,
    secret: "secret",
  })),
  saveVerificationToDatabase: vi.fn(),
}))

vi.mock("../infrastructure/email.server", () => ({
  sendMagicLinkEmail: vi.fn(),
}))

vi.mock("~/features/users/infrastructure/users-model.server", () => ({
  retrieveUserFromDatabaseByEmail: vi.fn(() => null),
  saveUserToDatabase: vi.fn(() => ({ id: "new-user-id" })),
  updateUserInDatabaseById: vi.fn(() => ({ id: "existing-user-id" })),
}))

const createVerifyRequest = () =>
  new Request("https://example.com/verify", {
    body: new URLSearchParams({
      code: "123456",
      intent: "verifyCode",
      target: "user@example.com",
      type: "login",
    }),
    method: "POST",
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-05-31T00:00:00.000Z"))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("authAction verify code", () => {
  test("given: a new signup email, should: create a verified user session", async () => {
    await expect(
      authAction({ request: createVerifyRequest() }),
    ).rejects.toMatchObject({
      status: 302,
    })

    expect(saveUserToDatabase).toHaveBeenCalledWith({
      email: "user@example.com",
      emailVerifiedAt: new Date("2026-05-31T00:00:00.000Z"),
    })
    expect(createUserSession).toHaveBeenCalledWith("new-user-id")
    expect(deleteVerificationFromDatabaseByTypeAndTarget).toHaveBeenCalledWith({
      target: "user@example.com",
      type: "login",
    })
  })

  test("given: an existing signup email, should: verify it and create a user session", async () => {
    vi.mocked(retrieveUserFromDatabaseByEmail).mockResolvedValueOnce({
      createdAt: new Date("2026-05-30T00:00:00.000Z"),
      email: "user@example.com",
      emailVerifiedAt: null,
      id: "existing-user-id",
      // FEATURE_SLOT_BEGIN:testHelpers:founderChatAuthTestUser
      lastSeenAt: null,
      // FEATURE_SLOT_END:testHelpers:founderChatAuthTestUser
      updatedAt: new Date("2026-05-30T00:00:00.000Z"),
    })

    await expect(
      authAction({ request: createVerifyRequest() }),
    ).rejects.toMatchObject({
      status: 302,
    })

    expect(updateUserInDatabaseById).toHaveBeenCalledWith({
      emailVerifiedAt: new Date("2026-05-31T00:00:00.000Z"),
      id: "existing-user-id",
    })
    expect(createUserSession).toHaveBeenCalledWith("existing-user-id")
  })

  test("given: an invalid code, should: not create a user session", async () => {
    vi.mocked(verifyVerificationTOTP).mockResolvedValueOnce(null)

    const response = await authAction({ request: createVerifyRequest() })

    expect(response.init?.status).toBe(400)
    expect(createUserSession).not.toHaveBeenCalled()
  })
})
