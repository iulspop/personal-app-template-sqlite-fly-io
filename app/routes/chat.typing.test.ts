import { beforeEach, describe, expect, test, vi } from "vitest"

import { action } from "./chat.typing"
import { requireUserId } from "~/features/auth/application/auth-session.server"
import {
  deleteChatTypingStateFromDatabaseByConversationIdAndUserId,
  retrieveConversationForParticipant,
  saveChatTypingStateToDatabase,
} from "~/features/chat/infrastructure/chat-model.server"

vi.mock("~/features/auth/application/auth-session.server", () => ({
  requireUserId: vi.fn(() => "user-id"),
}))
vi.mock("~/features/chat/infrastructure/chat-model.server", () => ({
  deleteChatTypingStateFromDatabaseByConversationIdAndUserId: vi.fn(),
  retrieveConversationForParticipant: vi.fn(() => ({ id: "conversation-id" })),
  saveChatTypingStateToDatabase: vi.fn(),
}))

const args = (request: Request) => ({
  context: {} as never,
  params: {},
  pattern: "/chat/typing",
  request,
  url: new URL(request.url),
})

const createRequest = (values: Record<string, string>) =>
  new Request("https://example.com/chat/typing", {
    body: new URLSearchParams(values),
    method: "POST",
  })

describe("chat typing action", () => {
  beforeEach(() => vi.clearAllMocks())

  test("given: an authorized typing start, should: save expiring typing state without caching", async () => {
    const request = createRequest({
      conversationId: "conversation-id",
      isTyping: "true",
    })
    const before = Date.now()
    const actual = await action(args(request))
    const [{ expiresAt }] = vi.mocked(saveChatTypingStateToDatabase).mock
      .calls[0]

    expect(requireUserId).toHaveBeenCalledWith(request)
    expect(retrieveConversationForParticipant).toHaveBeenCalledWith({
      conversationId: "conversation-id",
      requesterId: "user-id",
    })
    expect(expiresAt.getTime()).toBeGreaterThan(before)
    expect(actual).toMatchObject({
      data: { success: true },
      init: { headers: { "Cache-Control": "private, no-store" } },
    })
  })

  test("given: an authorized typing stop, should: clear typing state", async () => {
    const actual = await action(
      args(
        createRequest({
          conversationId: "conversation-id",
          isTyping: "false",
        }),
      ),
    )

    expect(
      deleteChatTypingStateFromDatabaseByConversationIdAndUserId,
    ).toHaveBeenCalledWith({
      conversationId: "conversation-id",
      userId: "user-id",
    })
    expect(actual).toMatchObject({ data: { success: true } })
  })

  test("given: an inaccessible conversation, should: return a non-enumerating failure", async () => {
    vi.mocked(retrieveConversationForParticipant).mockResolvedValueOnce(null)

    const actual = await action(
      args(
        createRequest({
          conversationId: "private-conversation",
          isTyping: "true",
        }),
      ),
    )

    expect(actual).toMatchObject({
      data: { error: "Unable to update typing state." },
      init: { status: 404 },
    })
    expect(saveChatTypingStateToDatabase).not.toHaveBeenCalled()
  })

  test("given: malformed typing input, should: return a non-enumerating failure", async () => {
    const actual = await action(
      args(createRequest({ conversationId: "", isTyping: "maybe" })),
    )

    expect(actual).toMatchObject({
      data: { error: "Unable to update typing state." },
      init: { status: 404 },
    })
    expect(retrieveConversationForParticipant).not.toHaveBeenCalled()
  })
})
