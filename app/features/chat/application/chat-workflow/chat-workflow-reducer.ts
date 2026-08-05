import type { ChatConnectionStatus } from "../../domain/chat-workflow-domain"
import { createChatDraftKey } from "../../domain/chat-workflow-domain"
import type { ChatWorkflowIdentity } from "../../domain/chat-workflow-ports"
import type { ChatWorkflowAction } from "./chat-workflow-actions"
import {
  CHAT_CONNECTION_CHANGED,
  CHAT_DRAFT_CHANGED,
  CHAT_DRAFT_CLEARED,
  CHAT_DRAFT_RESTORED,
  CHAT_NOTIFICATION_DISMISSED,
  CHAT_SNAPSHOT_RECEIVED,
  CHAT_THREAD_CLOSED,
  CHAT_THREAD_OPENED,
  CHAT_WORKFLOW_STARTED,
  CHAT_WORKFLOW_STOPPED,
} from "./chat-workflow-actions"

export type ChatWorkflowState = {
  activeThread: ChatWorkflowIdentity | null
  connection: { attempt: number; status: ChatConnectionStatus }
  drafts: Record<string, string>
  notificationDismissed: boolean
  snapshot: {
    latestAt: string | null
    sequence: number
    typingConversationIds: string[]
    unreadCount: number
  }
  viewerId: string | null
}

export const chatWorkflowInitialState: ChatWorkflowState = {
  activeThread: null,
  connection: { attempt: 0, status: "idle" },
  drafts: {},
  notificationDismissed: false,
  snapshot: {
    latestAt: null,
    sequence: 0,
    typingConversationIds: [],
    unreadCount: 0,
  },
  viewerId: null,
}

const omitDraft = (
  drafts: Record<string, string>,
  identity: ChatWorkflowIdentity,
) =>
  Object.fromEntries(
    Object.entries(drafts).filter(
      ([key]) => key !== createChatDraftKey(identity),
    ),
  )

export const chatWorkflowReducer = (
  state = chatWorkflowInitialState,
  action: ChatWorkflowAction,
): ChatWorkflowState => {
  switch (action.type) {
    case CHAT_WORKFLOW_STARTED:
      return { ...state, viewerId: action.payload.viewerId }
    case CHAT_WORKFLOW_STOPPED:
      return chatWorkflowInitialState
    case CHAT_CONNECTION_CHANGED:
      return { ...state, connection: action.payload }
    case CHAT_SNAPSHOT_RECEIVED:
      return {
        ...state,
        notificationDismissed: false,
        snapshot: {
          ...action.payload,
          sequence: state.snapshot.sequence + 1,
        },
      }
    case CHAT_THREAD_OPENED:
      return { ...state, activeThread: action.payload }
    case CHAT_THREAD_CLOSED:
      return state.activeThread?.conversationId ===
        action.payload.conversationId
        ? { ...state, activeThread: null }
        : state
    case CHAT_DRAFT_CHANGED:
    case CHAT_DRAFT_RESTORED:
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [createChatDraftKey(action.payload)]: action.payload.draft,
        },
      }
    case CHAT_DRAFT_CLEARED:
      return { ...state, drafts: omitDraft(state.drafts, action.payload) }
    case CHAT_NOTIFICATION_DISMISSED:
      return { ...state, notificationDismissed: true }
    default:
      return state
  }
}
