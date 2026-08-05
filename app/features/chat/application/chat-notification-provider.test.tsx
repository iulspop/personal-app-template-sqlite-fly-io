import { act, fireEvent, render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import { describe, expect, test, vi } from "vitest"

import { ChatNotificationProvider } from "./chat-notification-provider"
import {
  changeChatConnection,
  receiveChatSnapshot,
} from "./chat-workflow/chat-workflow-actions"
import { createStore } from "~/store/create-store"

vi.mock("./chat-workflow/chat-revalidation-bridge", () => ({
  ChatRevalidationBridgeComponent: () => null,
}))

const createTestStore = () =>
  createStore({
    ports: {
      founderChat: {
        drafts: {
          readDraft: () => "",
          removeDraft: () => undefined,
          writeDraft: () => undefined,
        },
        realtime: {
          isOnline: () => true,
          isVisible: () => true,
          observeOnline: () => () => undefined,
          observeVisibility: () => () => undefined,
          openConnection: () => ({ close: () => undefined }),
          publishPresence: async () => undefined,
          publishTyping: async () => undefined,
          wait: async () => undefined,
        },
      },
    },
    shouldRunSagas: false,
  })

const renderProvider = () => {
  const store = createTestStore()
  render(
    <Provider store={store}>
      <ChatNotificationProvider>
        <span>Application</span>
      </ChatNotificationProvider>
    </Provider>,
  )
  return store
}

describe("ChatNotificationProvider", () => {
  test("given: an unread realtime snapshot, should: render and dismiss the notification", () => {
    const store = renderProvider()
    act(() => {
      store.dispatch(
        receiveChatSnapshot({
          latestAt: "2026-08-05T10:00:00.000Z",
          typingConversationIds: [],
          unreadCount: 2,
        }),
      )
    })

    expect(screen.getByText("2 unread messages")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))

    expect(screen.queryByLabelText("Chat notification")).not.toBeInTheDocument()
  })

  test("given: an offline connection, should: announce restrained connection feedback", () => {
    const store = renderProvider()
    act(() => {
      store.dispatch(changeChatConnection({ status: "offline" }))
    })

    expect(
      screen.getByText(
        "Chat is offline. Updates will resume when your connection returns.",
      ),
    ).toBeInTheDocument()
  })
})
