import { describe, expect, test } from "vitest"

import {
  changeChatConnection,
  changeChatDraft,
  clearChatDraft,
  dismissChatNotification,
  openChatThread,
  receiveChatSnapshot,
} from "./chat-workflow-actions"
import {
  chatWorkflowInitialState,
  chatWorkflowReducer,
} from "./chat-workflow-reducer"

describe("chatWorkflowReducer()", () => {
  test("given: workflow facts, should: update only serializable client workflow state", () => {
    const identity = { conversationId: "conversation-1", viewerId: "viewer-1" }
    const actual = [
      openChatThread(identity),
      changeChatDraft({ ...identity, draft: "Hello" }),
      changeChatConnection({ attempt: 2, status: "reconnecting" }),
      receiveChatSnapshot({
        latestAt: "2026-08-05T12:00:00.000Z",
        typingConversationIds: ["conversation-1"],
        unreadCount: 3,
      }),
    ].reduce(chatWorkflowReducer, chatWorkflowInitialState)
    const expected = {
      activeThread: identity,
      connection: { attempt: 2, status: "reconnecting" },
      drafts: { "chat:draft:viewer-1:conversation-1": "Hello" },
      notificationDismissed: false,
      snapshot: {
        latestAt: "2026-08-05T12:00:00.000Z",
        sequence: 1,
        typingConversationIds: ["conversation-1"],
        unreadCount: 3,
      },
      viewerId: null,
    }

    expect(actual).toEqual(expected)
  })

  test("given: a dismissed notification, should: show it again for a newer unread snapshot", () => {
    const dismissed = chatWorkflowReducer(
      chatWorkflowInitialState,
      dismissChatNotification(),
    )
    const actual = chatWorkflowReducer(
      dismissed,
      receiveChatSnapshot({
        latestAt: "2026-08-05T12:00:00.000Z",
        typingConversationIds: [],
        unreadCount: 1,
      }),
    )
    const expected = false

    expect(actual.notificationDismissed).toEqual(expected)
  })

  test("given: a draft clear fact, should: remove the scoped draft", () => {
    const identity = { conversationId: "conversation-1", viewerId: "viewer-1" }
    const state = chatWorkflowReducer(
      chatWorkflowInitialState,
      changeChatDraft({ ...identity, draft: "Hello" }),
    )
    const actual = chatWorkflowReducer(state, clearChatDraft(identity)).drafts
    const expected = {}

    expect(actual).toEqual(expected)
  })
})
