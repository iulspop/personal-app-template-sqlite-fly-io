import { describe, expect, test } from "vitest"

import { chatWorkflowInitialState } from "./chat-workflow-reducer"
import {
  selectChatConnectionStatus,
  selectChatDraft,
  selectChatTypingConversationIds,
  selectChatUnreadCount,
  selectIsChatNotificationVisible,
} from "./chat-workflow-selectors"

const state = {
  chatWorkflow: {
    ...chatWorkflowInitialState,
    connection: { attempt: 0, status: "connected" as const },
    drafts: { "chat:draft:viewer-1:conversation-1": "Hello" },
    snapshot: {
      latestAt: "2026-08-05T12:00:00.000Z",
      sequence: 1,
      typingConversationIds: ["conversation-1"],
      unreadCount: 2,
    },
  },
}

describe("chat workflow selectors", () => {
  test("given: workflow state, should: select connection and realtime values", () => {
    const actual = {
      connection: selectChatConnectionStatus(state),
      typing: selectChatTypingConversationIds(state),
      unread: selectChatUnreadCount(state),
      visible: selectIsChatNotificationVisible(state),
    }
    const expected = {
      connection: "connected",
      typing: ["conversation-1"],
      unread: 2,
      visible: true,
    }

    expect(actual).toEqual(expected)
  })

  test("given: a scoped draft, should: select only that conversation draft", () => {
    const actual = selectChatDraft(state, {
      conversationId: "conversation-1",
      viewerId: "viewer-1",
    })
    const expected = "Hello"

    expect(actual).toEqual(expected)
  })
})
