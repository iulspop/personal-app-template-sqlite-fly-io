import {
  CHAT_REALTIME_RECONNECT_INITIAL_MS,
  CHAT_REALTIME_RECONNECT_MAX_MS,
} from "./chat-constants"

export type ChatConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"

export type ChatRealtimeSnapshot = {
  latestAt: string | null
  typingConversationIds: string[]
  unreadCount: number
}

export type ChatTypingState = {
  conversationId: string
  expiresAt: string
}

export const calculateChatReconnectDelay = ({
  attempt,
  initialDelayMs = CHAT_REALTIME_RECONNECT_INITIAL_MS,
  maximumDelayMs = CHAT_REALTIME_RECONNECT_MAX_MS,
}: {
  attempt: number
  initialDelayMs?: number
  maximumDelayMs?: number
}) =>
  Math.min(
    maximumDelayMs,
    initialDelayMs * 2 ** Math.max(0, Math.floor(attempt)),
  )

export const isChatTypingActive = ({
  expiresAt,
  now = new Date(),
}: {
  expiresAt: string
  now?: Date
}) => {
  const expiryTime = Date.parse(expiresAt)

  return Number.isFinite(expiryTime) && expiryTime > now.getTime()
}

export const isChatTypingVisible = ({
  conversationId,
  typingConversationIds,
}: {
  conversationId: string
  typingConversationIds: readonly string[]
}) => typingConversationIds.includes(conversationId)

export const createChatDraftKey = ({
  conversationId,
  viewerId,
}: {
  conversationId: string
  viewerId: string
}) =>
  `chat:draft:${encodeURIComponent(viewerId)}:${encodeURIComponent(conversationId)}`
