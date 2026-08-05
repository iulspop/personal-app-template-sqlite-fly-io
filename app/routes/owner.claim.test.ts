import { beforeEach, describe, expect, test, vi } from "vitest"

import { action, loader } from "./owner.claim"
import { resetServerEnvCacheForTests } from "~/config/server-env.server"
import { requireUserId } from "~/features/auth/application/auth-session.server"
import {
  claimOwnerSeat,
  retrieveOwnerClaim,
} from "~/features/chat/infrastructure/chat-model.server"
import { retrieveUserFromDatabaseById } from "~/features/users/infrastructure/users-model.server"

vi.mock("~/features/auth/application/auth-session.server", () => ({
  requireUserId: vi.fn(() => "user-id"),
}))
vi.mock("~/features/chat/infrastructure/chat-model.server", () => ({
  claimOwnerSeat: vi.fn(),
  retrieveOwnerClaim: vi.fn(() => null),
}))
vi.mock("~/features/users/infrastructure/users-model.server", () => ({
  retrieveUserFromDatabaseById: vi.fn(() => ({
    email: "owner@example.com",
    emailVerifiedAt: new Date(),
    id: "user-id",
  })),
}))

const args = (request: Request) => ({
  context: {} as never,
  params: {},
  pattern: "/owner/claim",
  request,
  url: new URL(request.url),
})

describe("owner claim route", () => {
  beforeEach(() => {
    resetServerEnvCacheForTests()
  })

  test("given: an allowlisted verified user, should: expose owner claim", async () => {
    process.env.OWNER_EMAIL_ALLOWLIST = "OWNER@example.com"
    const actual = await loader(
      args(new Request("https://example.com/owner/claim")),
    )
    expect(actual.eligible).toEqual(true)
  })

  test("given: an ineligible user, should: reject the claim without exposing the allowlist", async () => {
    process.env.OWNER_EMAIL_ALLOWLIST = "someone@example.com"
    const request = new Request("https://example.com/owner/claim", {
      body: new URLSearchParams({ intent: "claimOwner" }),
      method: "POST",
    })
    const actual = await action(args(request))
    expect(actual).toMatchObject({
      data: { error: "Owner setup is unavailable." },
      init: { status: 404 },
    })
    expect(claimOwnerSeat).not.toHaveBeenCalled()
  })

  test("given: the current owner, should: redirect to the dashboard", async () => {
    vi.mocked(retrieveOwnerClaim).mockResolvedValueOnce({
      userId: "user-id",
    } as never)
    await expect(
      loader(args(new Request("https://example.com/owner/claim"))),
    ).rejects.toMatchObject({ status: 302 })
    expect(requireUserId).toHaveBeenCalled()
    expect(retrieveUserFromDatabaseById).toHaveBeenCalled()
  })
})
