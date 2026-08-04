import { CHAT_ONLINE_THRESHOLD_MS } from "./chat-constants"

type ConversationParticipants = {
  ownerId: string
  userId: string
}

type UnreadMessage = {
  createdAt: Date
  senderId: string
}

export function canAccessConversation(
  viewerId: string,
  conversation: ConversationParticipants,
) {
  return viewerId === conversation.ownerId || viewerId === conversation.userId
}

export function countUnreadMessages({
  messages,
  readAt,
  viewerId,
}: {
  messages: UnreadMessage[]
  readAt: Date | null
  viewerId: string
}) {
  return messages.filter(
    (message) =>
      message.senderId !== viewerId &&
      (readAt === null || message.createdAt > readAt),
  ).length
}

export function isUserOnline(
  lastSeenAt: Date | null,
  now = new Date(),
  thresholdMs = CHAT_ONLINE_THRESHOLD_MS,
) {
  return (
    lastSeenAt !== null && now.getTime() - lastSeenAt.getTime() <= thresholdMs
  )
}

export function formatPresence(
  lastSeenAt: Date | null,
  now = new Date(),
): string {
  if (lastSeenAt === null) return "Offline"
  if (isUserOnline(lastSeenAt, now)) return "Online"

  const elapsedMs = Math.max(0, now.getTime() - lastSeenAt.getTime())
  const elapsedMinutes = Math.floor(elapsedMs / 60_000)
  if (elapsedMinutes < 60)
    return `Last seen ${Math.max(1, elapsedMinutes)}m ago`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `Last seen ${elapsedHours}h ago`

  const elapsedDays = Math.floor(elapsedHours / 24)
  if (elapsedDays < 7) return `Last seen ${elapsedDays}d ago`

  return `Last seen ${lastSeenAt.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year:
      lastSeenAt.getFullYear() === now.getFullYear() ? undefined : "numeric",
  })}`
}

export function parseOwnerEmailAllowlist(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isOwnerEmailAllowed(
  email: string,
  allowedEmails: ReadonlySet<string>,
) {
  return allowedEmails.has(email.trim().toLowerCase())
}
