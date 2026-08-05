import { describe, expect, test, vi } from "vitest"

import { loader } from "./chat.events"
import { requireUserId } from "~/features/auth/application/auth-session.server"

vi.mock("~/features/auth/application/auth-session.server", () => ({
  requireUserId: vi.fn(() => "user-id"),
}))
vi.mock("~/features/chat/infrastructure/chat-model.server", () => ({
  retrieveChatEventSnapshot: vi.fn(() => ({
    latestAt: "2026-08-05T10:00:00.000Z",
    typingConversationIds: ["conversation-id"],
    unreadCount: 2,
  })),
}))

const args = (request: Request) => ({
  context: {} as never,
  params: {},
  pattern: "/chat/events",
  request,
  url: new URL(request.url),
})

describe("chat events loader", () => {
  test("given: an authenticated user, should: return a private SSE stream", async () => {
    const controller = new AbortController()
    const request = new Request("https://example.com/chat/events", {
      signal: controller.signal,
    })
    const actual = await loader(args(request))
    expect(requireUserId).toHaveBeenCalledWith(request)
    expect(actual.headers.get("Content-Type")).toEqual("text/event-stream")
    expect(actual.headers.get("Cache-Control")).toEqual(
      "private, no-cache, no-transform",
    )
    const reader = actual.body?.getReader()
    const firstChunk = await reader?.read()
    const snapshot = new TextDecoder().decode(firstChunk?.value)
    expect(snapshot).toContain("event: snapshot")
    expect(snapshot).toContain('"typingConversationIds":["conversation-id"]')
    expect(snapshot).not.toContain("message")
    expect(snapshot).not.toContain("participant")
    controller.abort()
    await reader?.cancel()
  })
})
