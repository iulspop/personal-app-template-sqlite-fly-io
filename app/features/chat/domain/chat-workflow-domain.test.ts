import { describe, expect, test } from "vitest"

import {
  calculateChatReconnectDelay,
  createChatDraftKey,
  isChatTypingActive,
  isChatTypingVisible,
} from "./chat-workflow-domain"

describe("calculateChatReconnectDelay()", () => {
  test("given: reconnect attempts below the cap, should: increase delay exponentially", () => {
    const actual = [0, 1, 2, 3].map((attempt) =>
      calculateChatReconnectDelay({ attempt }),
    )
    const expected = [1000, 2000, 4000, 8000]

    expect(actual).toEqual(expected)
  })

  test("given: reconnect attempts above the cap, should: return the maximum delay", () => {
    const actual = calculateChatReconnectDelay({ attempt: 20 })
    const expected = 30_000

    expect(actual).toEqual(expected)
  })

  test("given: a negative reconnect attempt, should: return the initial delay", () => {
    const actual = calculateChatReconnectDelay({ attempt: -1 })
    const expected = 1000

    expect(actual).toEqual(expected)
  })
})

describe("isChatTypingActive()", () => {
  const now = new Date("2026-08-05T12:00:00.000Z")

  test("given: typing expires after now, should: report active", () => {
    const actual = isChatTypingActive({
      expiresAt: "2026-08-05T12:00:01.000Z",
      now,
    })
    const expected = true

    expect(actual).toEqual(expected)
  })

  test("given: typing expires at now, should: report inactive", () => {
    const actual = isChatTypingActive({
      expiresAt: "2026-08-05T12:00:00.000Z",
      now,
    })
    const expected = false

    expect(actual).toEqual(expected)
  })

  test("given: an invalid expiry, should: report inactive", () => {
    const actual = isChatTypingActive({ expiresAt: "invalid", now })
    const expected = false

    expect(actual).toEqual(expected)
  })
})

describe("isChatTypingVisible()", () => {
  test("given: the active conversation is typing, should: report visible", () => {
    const actual = isChatTypingVisible({
      conversationId: "conversation-1",
      typingConversationIds: ["conversation-1", "conversation-2"],
    })
    const expected = true

    expect(actual).toEqual(expected)
  })

  test("given: another conversation is typing, should: report hidden", () => {
    const actual = isChatTypingVisible({
      conversationId: "conversation-1",
      typingConversationIds: ["conversation-2"],
    })
    const expected = false

    expect(actual).toEqual(expected)
  })
})

describe("createChatDraftKey()", () => {
  test("given: viewer and conversation identifiers, should: scope and encode the draft key", () => {
    const actual = createChatDraftKey({
      conversationId: "conversation/1",
      viewerId: "user@example.com",
    })
    const expected = "chat:draft:user%40example.com:conversation%2F1"

    expect(actual).toEqual(expected)
  })
})
