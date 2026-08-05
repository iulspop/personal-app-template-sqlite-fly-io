import type { ChatRealtimeSnapshot } from "./chat-workflow-domain"

export type ChatWorkflowIdentity = {
  conversationId: string
  viewerId: string
}

export type ChatRealtimeConnection = {
  close: () => void
}

export type ChatRealtimePort = {
  isOnline: () => boolean
  isVisible: () => boolean
  observeOnline: (listener: (isOnline: boolean) => void) => () => void
  observeVisibility: (listener: (isVisible: boolean) => void) => () => void
  openConnection: (handlers: {
    onError: () => void
    onOpen: () => void
    onSnapshot: (snapshot: ChatRealtimeSnapshot) => void
  }) => ChatRealtimeConnection
  publishPresence: () => Promise<void>
  publishTyping: (input: {
    conversationId: string
    isTyping: boolean
  }) => Promise<void>
  wait: (delayMs: number) => Promise<void>
}

export type ChatDraftsPort = {
  readDraft: (identity: ChatWorkflowIdentity) => string
  removeDraft: (identity: ChatWorkflowIdentity) => void
  writeDraft: (input: ChatWorkflowIdentity & { draft: string }) => void
}

export type ChatWorkflowPorts = {
  drafts: ChatDraftsPort
  realtime: ChatRealtimePort
}
