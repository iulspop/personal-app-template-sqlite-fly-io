import type { ChatRealtimeSnapshot } from "../domain/chat-workflow-domain"
import type { ChatRealtimePort } from "../domain/chat-workflow-ports"

type EventSourceClient = {
  addEventListener: (
    type: string,
    listener: (event: MessageEvent<string>) => void,
  ) => void
  close: () => void
}

type BrowserEventTarget = {
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

type ChatRealtimeClientOptions = {
  createEventSource?: (url: string) => EventSourceClient
  document?: BrowserEventTarget & { visibilityState: DocumentVisibilityState }
  fetch?: typeof globalThis.fetch
  setTimeout?: typeof globalThis.setTimeout
  window?: BrowserEventTarget & { navigator: Pick<Navigator, "onLine"> }
}

const parseSnapshot = (data: string): ChatRealtimeSnapshot | null => {
  try {
    return JSON.parse(data) as ChatRealtimeSnapshot
  } catch {
    return null
  }
}

const requireSuccessfulResponse = async (response: Promise<Response>) => {
  const { ok } = await response

  if (!ok) throw new Error("Chat workflow request failed")
}

export const createChatRealtimeClient = ({
  createEventSource = (url) => new EventSource(url),
  document = globalThis.document,
  fetch = globalThis.fetch,
  setTimeout = globalThis.setTimeout,
  window = globalThis.window,
}: ChatRealtimeClientOptions = {}): ChatRealtimePort => ({
  isOnline: () => window?.navigator.onLine ?? true,
  isVisible: () => document?.visibilityState !== "hidden",
  observeOnline: (listener) => {
    const notify = () => listener(window?.navigator.onLine ?? true)

    window?.addEventListener("online", notify)
    window?.addEventListener("offline", notify)

    return () => {
      window?.removeEventListener("online", notify)
      window?.removeEventListener("offline", notify)
    }
  },
  observeVisibility: (listener) => {
    const notify = () => listener(document?.visibilityState !== "hidden")

    document?.addEventListener("visibilitychange", notify)

    return () => document?.removeEventListener("visibilitychange", notify)
  },
  openConnection: ({ onError, onOpen, onSnapshot }) => {
    const source = createEventSource("/chat/events")

    source.addEventListener("open", onOpen)
    source.addEventListener("error", onError)
    source.addEventListener("chat", ({ data }) => {
      const snapshot = parseSnapshot(data)

      if (snapshot !== null) onSnapshot(snapshot)
    })

    return { close: () => source.close() }
  },
  publishPresence: () =>
    requireSuccessfulResponse(fetch("/chat/presence", { method: "POST" })),
  publishTyping: ({ conversationId, isTyping }) =>
    requireSuccessfulResponse(
      fetch("/chat/typing", {
        body: new URLSearchParams({
          conversationId,
          isTyping: String(isTyping),
        }),
        method: "POST",
      }),
    ),
  wait: (delayMs) =>
    new Promise((resolve) => {
      setTimeout(resolve, delayMs)
    }),
})
