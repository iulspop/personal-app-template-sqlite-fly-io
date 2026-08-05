import { data } from "react-router"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { action, loader } from "./index"
import {
  getUserId,
  requireUserId,
} from "~/features/auth/application/auth-session.server"
import { sendVerificationEmail } from "~/features/auth/infrastructure/email.server"
import { generateVerificationTOTP } from "~/features/auth/infrastructure/totp.server"
import {
  retrieveVerificationFromDatabaseByTypeAndTarget,
  saveVerificationToDatabase,
} from "~/features/auth/infrastructure/verifications-model.server"
import { todosAction } from "~/features/todos/application/todos-action.server"
import { retrieveAllTodosFromDatabase } from "~/features/todos/infrastructure/todos-model.server"

vi.mock("~/features/auth/application/auth-session.server", () => ({
  getUserId: vi.fn(() => "user-id"),
  requireUserId: vi.fn(() => "user-id"),
}))

vi.mock("~/features/auth/infrastructure/email.server", () => ({
  sendVerificationEmail: vi.fn(),
}))

vi.mock("~/features/auth/infrastructure/totp.server", () => ({
  generateVerificationTOTP: vi.fn(() => ({
    algorithm: "SHA-1",
    charSet: "ABC123",
    digits: 6,
    otp: "123456",
    period: 600,
    secret: "secret",
  })),
}))

vi.mock("~/features/auth/infrastructure/verifications-model.server", () => ({
  retrieveVerificationFromDatabaseByTypeAndTarget: vi.fn(() => null),
  saveVerificationToDatabase: vi.fn(),
}))

vi.mock("~/features/todos/application/todos-action.server", () => ({
  todosAction: vi.fn(() => data({ error: null, success: true })),
}))

vi.mock("~/features/todos/infrastructure/todos-model.server", () => ({
  retrieveAllTodosFromDatabase: vi.fn(() => []),
}))

vi.mock("~/features/auth/infrastructure/passkeys-model.server", () => ({
  retrievePasskeysFromDatabaseByUserId: vi.fn(() => []),
}))

// FEATURE_SLOT_BEGIN:testHelpers:founderChatIndexMocks
vi.mock("~/features/chat/infrastructure/chat-model.server", () => ({
  countUnreadMessages: vi.fn(() => 0),
  retrieveOrCreateConversation: vi.fn(() => ({ id: "conversation-id" })),
  retrieveOwnerClaim: vi.fn(() => null),
  retrieveOwnerConversationSummaries: vi.fn(() => []),
  retrieveOwnerStatusForUser: vi.fn(() => null),
}))
// FEATURE_SLOT_END:testHelpers:founderChatIndexMocks

vi.mock("~/features/users/infrastructure/users-model.server", () => ({
  retrieveUserFromDatabaseById: vi.fn(() => ({
    createdAt: new Date("2026-05-31T00:00:00.000Z"),
    email: "user@example.com",
    emailVerifiedAt: null,
    id: "user-id",
    updatedAt: new Date("2026-05-31T00:00:00.000Z"),
  })),
}))

const createRouteArgs = (request: Request) => ({
  context: {} as never,
  params: {},
  pattern: "/",
  request,
  url: new URL(request.url),
})

const createResendRequest = () =>
  new Request("https://example.com/", {
    body: new URLSearchParams({ intent: "resendEmailVerification" }),
    method: "POST",
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.setSystemTime(new Date("2026-05-31T00:00:00.000Z"))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("index loader", () => {
  test("given: an anonymous visitor, should: return landing page data", async () => {
    vi.mocked(getUserId).mockResolvedValueOnce(null)

    const loaderData = await loader(
      createRouteArgs(new Request("https://example.com/")),
    )

    const expected = {
      canClaimOwner: false,
      chatUnreadCount: 0,
      hasPasskeys: false,
      isEmailVerified: false,
      isLanding: true,
      isOwner: false,
      pageTitle: "Todo Demo",
      resendEmailVerificationCooldownSeconds: 0,
      userEmail: "",
    }
    const actual = loaderData

    expect(actual).toEqual(expected)
    expect(retrieveAllTodosFromDatabase).not.toHaveBeenCalled()
  })

  test("given: an unverified user with a recent verification email, should: return remaining resend cooldown", async () => {
    vi.mocked(
      retrieveVerificationFromDatabaseByTypeAndTarget,
    ).mockResolvedValueOnce({
      algorithm: "SHA-1",
      charSet: "ABC123",
      createdAt: new Date("2026-05-30T23:59:30.000Z"),
      digits: 6,
      expiresAt: new Date("2026-05-31T00:09:30.000Z"),
      id: "verification-id",
      period: 600,
      secret: "secret",
      target: "user@example.com",
      type: "email",
    })

    const loaderData = await loader(
      createRouteArgs(new Request("https://example.com/")),
    )

    expect(retrieveAllTodosFromDatabase).toHaveBeenCalledWith()
    expect(loaderData.resendEmailVerificationCooldownSeconds).toEqual(90)
  })

  test("given: a resent verification email with an older record, should: return cooldown from the latest expiry", async () => {
    vi.mocked(
      retrieveVerificationFromDatabaseByTypeAndTarget,
    ).mockResolvedValueOnce({
      algorithm: "SHA-1",
      charSet: "ABC123",
      createdAt: new Date("2026-05-30T23:00:00.000Z"),
      digits: 6,
      expiresAt: new Date("2026-05-31T00:10:00.000Z"),
      id: "verification-id",
      period: 600,
      secret: "secret",
      target: "user@example.com",
      type: "email",
    })

    const loaderData = await loader(
      createRouteArgs(new Request("https://example.com/")),
    )

    expect(loaderData.resendEmailVerificationCooldownSeconds).toEqual(120)
  })
})

describe("index action", () => {
  test("given: a resend email verification request, should: send a new verification email", async () => {
    const request = createResendRequest()

    const response = await action(createRouteArgs(request))

    expect(requireUserId).toHaveBeenCalledWith(request)
    expect(generateVerificationTOTP).toHaveBeenCalledWith()
    expect(saveVerificationToDatabase).toHaveBeenCalledWith({
      algorithm: "SHA-1",
      charSet: "ABC123",
      digits: 6,
      expiresAt: new Date("2026-05-31T00:10:00.000Z"),
      period: 600,
      secret: "secret",
      target: "user@example.com",
      type: "email",
    })
    expect(sendVerificationEmail).toHaveBeenCalledWith({
      code: "123456",
      email: "user@example.com",
      verificationUrl:
        "https://example.com/auth/callback?type=email&target=user%40example.com&code=123456",
    })
    expect(response.data).toEqual({
      cooldownSeconds: 120,
      error: null,
      intent: "resendEmailVerification",
      success: true,
    })
  })

  test("given: a verification email inside the resend cooldown, should: rate limit resends", async () => {
    vi.mocked(
      retrieveVerificationFromDatabaseByTypeAndTarget,
    ).mockResolvedValueOnce({
      algorithm: "SHA-1",
      charSet: "ABC123",
      createdAt: new Date("2026-05-30T23:00:00.000Z"),
      digits: 6,
      expiresAt: new Date("2026-05-31T00:09:01.000Z"),
      id: "verification-id",
      period: 600,
      secret: "secret",
      target: "user@example.com",
      type: "email",
    })

    const response = await action(createRouteArgs(createResendRequest()))

    expect(saveVerificationToDatabase).not.toHaveBeenCalled()
    expect(sendVerificationEmail).not.toHaveBeenCalled()
    expect({ body: response.data, status: response.init?.status }).toEqual({
      body: {
        cooldownSeconds: 61,
        error: "Please wait before requesting another verification email.",
        intent: "resendEmailVerification",
        success: false,
      },
      status: 429,
    })
  })

  test("given: a verification email older than the resend cooldown, should: send a new verification email", async () => {
    vi.mocked(
      retrieveVerificationFromDatabaseByTypeAndTarget,
    ).mockResolvedValueOnce({
      algorithm: "SHA-1",
      charSet: "ABC123",
      createdAt: new Date("2026-05-30T23:00:00.000Z"),
      digits: 6,
      expiresAt: new Date("2026-05-31T00:07:59.000Z"),
      id: "verification-id",
      period: 600,
      secret: "secret",
      target: "user@example.com",
      type: "email",
    })

    const response = await action(createRouteArgs(createResendRequest()))

    expect(generateVerificationTOTP).toHaveBeenCalledWith()
    expect(sendVerificationEmail).toHaveBeenCalledWith({
      code: "123456",
      email: "user@example.com",
      verificationUrl:
        "https://example.com/auth/callback?type=email&target=user%40example.com&code=123456",
    })
    expect(response.data).toEqual({
      cooldownSeconds: 120,
      error: null,
      intent: "resendEmailVerification",
      success: true,
    })
  })

  test("given: a todo request, should: delegate to the todos action", async () => {
    const request = new Request("https://example.com/", {
      body: new URLSearchParams({ intent: "createTodo", title: "Test" }),
      method: "POST",
    })

    await action(createRouteArgs(request))

    expect(todosAction).toHaveBeenCalledWith(createRouteArgs(request))
  })
})
