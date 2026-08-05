import { call, put } from "redux-saga/effects"
import { describe, expect, test, vi } from "vitest"

import { changeChatConnection, restoreChatDraft } from "./chat-workflow-actions"
import {
  reconnectChat,
  restoreChatThreadDraft,
  updateChatOnlineStatus,
} from "./chat-workflow-sagas"

const identity = { conversationId: "conversation-1", viewerId: "viewer-1" }

describe("restoreChatThreadDraft()", () => {
  test("given: an opened thread, should: read and restore its scoped draft", () => {
    const readDraft = vi.fn()
    const iterator = restoreChatThreadDraft({ readDraft }, identity)

    expect(iterator.next().value).toEqual(call(readDraft, identity))
    expect(iterator.next("Draft").value).toEqual(
      put(restoreChatDraft({ ...identity, draft: "Draft" })),
    )
    expect(iterator.next().done).toEqual(true)
  })
})

describe("updateChatOnlineStatus()", () => {
  test("given: the browser goes offline, should: expose offline connection state", () => {
    const iterator = updateChatOnlineStatus(false)

    expect(iterator.next().value).toEqual(
      put(changeChatConnection({ status: "offline" })),
    )
    expect(iterator.next().done).toEqual(true)
  })
})

describe("reconnectChat()", () => {
  test("given: a reconnect attempt, should: expose status and wait through the realtime port", () => {
    const wait = vi.fn()
    const iterator = reconnectChat({ wait }, 2)

    expect(iterator.next().value).toEqual(
      put(changeChatConnection({ attempt: 2, status: "reconnecting" })),
    )
    expect(iterator.next().value).toEqual(call(wait, 4000))
    expect(iterator.next().done).toEqual(true)
  })
})
