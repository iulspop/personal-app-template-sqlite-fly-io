export const CHAT_MESSAGE_MAX_LENGTH = 4000
export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
export const CHAT_ATTACHMENT_MAX_COUNT = 4
export const CHAT_MESSAGE_PAGE_SIZE = 50
export const CHAT_PRESENCE_HEARTBEAT_MS = 20_000
export const CHAT_ONLINE_THRESHOLD_MS = 45_000
export const CHAT_NOTIFICATION_COOLDOWN_MS = 5 * 60_000
export const CHAT_REALTIME_RECONNECT_INITIAL_MS = 1000
export const CHAT_REALTIME_RECONNECT_MAX_MS = 30_000
export const CHAT_TYPING_PUBLISH_THROTTLE_MS = 1000
export const CHAT_TYPING_IDLE_TIMEOUT_MS = 3000
export const CHAT_TYPING_EXPIRY_MS = 5000

export const CHAT_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const

export const CHAT_SEND_MESSAGE_INTENT = "sendMessage"
export const CHAT_MARK_READ_INTENT = "markRead"
export const CHAT_CLAIM_OWNER_INTENT = "claimOwner"
