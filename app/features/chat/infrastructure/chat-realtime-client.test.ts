import { describe, expect, test, vi } from "vitest"

import { createChatRealtimeClient } from "./chat-realtime-client"

class EventSourceStub {
  static instances: EventSourceStub[] = []

  readonly listeners = new Map<string, (event: MessageEvent<string>) => void>()
  readonly close = vi.fn()

  constructor(readonly url: string) {
    EventSourceStub.instances.push(this)
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent<string>) => void,
  ) {
    this.listeners.set(type, listener)
  }

  emit(type: string, data = "") {
    this.listeners.get(type)?.({ data } as MessageEvent<string>)
  }
}

describe("createChatRealtimeClient()", () => {
  test("given: an opened realtime connection, should: forward lifecycle and snapshot events", () => {
    EventSourceStub.instances = []
    const onOpen = vi.fn()
    const onError = vi.fn()
    const onSnapshot = vi.fn()
    const client = createChatRealtimeClient({
      createEventSource: (url) => new EventSourceStub(url),
      fetch: vi.fn(),
    })

    const connection = client.openConnection({ onError, onOpen, onSnapshot })
    const source = EventSourceStub.instances[0]
    source?.emit("open")
    source?.emit(
      "chat",
      JSON.stringify({
        latestAt: "2026-08-05T12:00:00.000Z",
        typingConversationIds: ["conversation-1"],
        unreadCount: 2,
      }),
    )
    source?.emit("error")
    connection.close()

    expect(source?.url).toEqual("/chat/events")
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onSnapshot).toHaveBeenCalledWith({
      latestAt: "2026-08-05T12:00:00.000Z",
      typingConversationIds: ["conversation-1"],
      unreadCount: 2,
    })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(source?.close).toHaveBeenCalledTimes(1)
  })

  test("given: presence and typing publications, should: post private workflow intents", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true })
    const client = createChatRealtimeClient({
      createEventSource: (url) => new EventSourceStub(url),
      fetch,
    })

    await client.publishPresence()
    await client.publishTyping({
      conversationId: "conversation-1",
      isTyping: true,
    })

    expect(fetch).toHaveBeenNthCalledWith(1, "/chat/presence", {
      method: "POST",
    })
    expect(fetch).toHaveBeenNthCalledWith(2, "/chat/typing", {
      body: expect.any(URLSearchParams),
      method: "POST",
    })
    expect(fetch.mock.calls[1]?.[1]?.body.toString()).toEqual(
      "conversationId=conversation-1&isTyping=true",
    )
  })
})
