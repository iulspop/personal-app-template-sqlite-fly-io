import type {
  ChatConnectionStatus,
  ChatRealtimeSnapshot,
} from "../../domain/chat-workflow-domain"
import type { ChatWorkflowIdentity } from "../../domain/chat-workflow-ports"

export const CHAT_WORKFLOW_STARTED = "chat/workflowStarted" as const
export const CHAT_WORKFLOW_STOPPED = "chat/workflowStopped" as const
export const CHAT_CONNECTION_CHANGED = "chat/connectionChanged" as const
export const CHAT_SNAPSHOT_RECEIVED = "chat/snapshotReceived" as const
export const CHAT_THREAD_OPENED = "chat/threadOpened" as const
export const CHAT_THREAD_CLOSED = "chat/threadClosed" as const
export const CHAT_DRAFT_CHANGED = "chat/draftChanged" as const
export const CHAT_DRAFT_RESTORED = "chat/draftRestored" as const
export const CHAT_DRAFT_CLEARED = "chat/draftCleared" as const
export const CHAT_TYPING_ACTIVITY = "chat/typingActivity" as const
export const CHAT_TYPING_STOPPED = "chat/typingStopped" as const
export const CHAT_NOTIFICATION_DISMISSED = "chat/notificationDismissed" as const

export const startChatWorkflow = (viewerId: string) => ({
  payload: { viewerId },
  type: CHAT_WORKFLOW_STARTED,
})
export const stopChatWorkflow = () => ({ type: CHAT_WORKFLOW_STOPPED })
export const changeChatConnection = ({
  attempt = 0,
  status,
}: {
  attempt?: number
  status: ChatConnectionStatus
}) => ({ payload: { attempt, status }, type: CHAT_CONNECTION_CHANGED })
export const receiveChatSnapshot = (snapshot: ChatRealtimeSnapshot) => ({
  payload: snapshot,
  type: CHAT_SNAPSHOT_RECEIVED,
})
export const openChatThread = (identity: ChatWorkflowIdentity) => ({
  payload: identity,
  type: CHAT_THREAD_OPENED,
})
export const closeChatThread = (identity: ChatWorkflowIdentity) => ({
  payload: identity,
  type: CHAT_THREAD_CLOSED,
})
export const changeChatDraft = (
  input: ChatWorkflowIdentity & { draft: string },
) => ({
  payload: input,
  type: CHAT_DRAFT_CHANGED,
})
export const restoreChatDraft = (
  input: ChatWorkflowIdentity & { draft: string },
) => ({
  payload: input,
  type: CHAT_DRAFT_RESTORED,
})
export const clearChatDraft = (identity: ChatWorkflowIdentity) => ({
  payload: identity,
  type: CHAT_DRAFT_CLEARED,
})
export const publishChatTyping = (identity: ChatWorkflowIdentity) => ({
  payload: identity,
  type: CHAT_TYPING_ACTIVITY,
})
export const stopChatTyping = (identity: ChatWorkflowIdentity) => ({
  payload: identity,
  type: CHAT_TYPING_STOPPED,
})
export const dismissChatNotification = () => ({
  type: CHAT_NOTIFICATION_DISMISSED,
})

export type ChatWorkflowAction =
  | ReturnType<typeof startChatWorkflow>
  | ReturnType<typeof stopChatWorkflow>
  | ReturnType<typeof changeChatConnection>
  | ReturnType<typeof receiveChatSnapshot>
  | ReturnType<typeof openChatThread>
  | ReturnType<typeof closeChatThread>
  | ReturnType<typeof changeChatDraft>
  | ReturnType<typeof restoreChatDraft>
  | ReturnType<typeof clearChatDraft>
  | ReturnType<typeof publishChatTyping>
  | ReturnType<typeof stopChatTyping>
  | ReturnType<typeof dismissChatNotification>
