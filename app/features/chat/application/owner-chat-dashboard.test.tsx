import { Provider } from "react-redux"
import { MemoryRouter } from "react-router"
import { expect, test, vi } from "vitest"

import type { ChatWorkflowPorts } from "../domain/chat-workflow-ports"
import { receiveChatSnapshot } from "./chat-workflow/chat-workflow-actions"
import { OwnerChatDashboard } from "./owner-chat-dashboard"
import { createStore } from "~/store/create-store"
import { render, screen } from "~/test/react-test-utils"

const createPorts = (): ChatWorkflowPorts => ({
  drafts: {
    readDraft: () => "",
    removeDraft: vi.fn(),
    writeDraft: vi.fn(),
  },
  realtime: {
    isOnline: () => true,
    isVisible: () => true,
    observeOnline: () => vi.fn(),
    observeVisibility: () => vi.fn(),
    openConnection: () => ({ close: vi.fn() }),
    publishPresence: async () => undefined,
    publishTyping: async () => undefined,
    wait: async () => undefined,
  },
})

test("given: a user is typing, should: show typing in the founder inbox", () => {
  const store = createStore({
    ports: { founderChat: createPorts() },
    shouldRunSagas: false,
  })
  store.dispatch(
    receiveChatSnapshot({
      latestAt: null,
      typingConversationIds: ["conversation-id"],
      unreadCount: 0,
    }),
  )

  render(
    <Provider store={store}>
      <MemoryRouter>
        <OwnerChatDashboard
          conversations={[
            {
              id: "conversation-id",
              latestMessage: null,
              unreadCount: 0,
              user: { email: "user@example.com", lastSeenAt: null },
            },
          ]}
        />
      </MemoryRouter>
    </Provider>,
  )

  expect(screen.getByText("Typing…")).toBeVisible()
})
