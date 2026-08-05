import { render, screen, waitFor } from "@testing-library/react"
import { expect, test, vi } from "vitest"

import { changeChatDraft } from "../features/chat/application/chat-workflow/chat-workflow-actions"
import { createStore } from "./create-store"
import { ChatStoreProviderComponent, useAppSelector } from "./store-provider"

const ViewerComponent = () => {
  const viewerId = useAppSelector(({ chatWorkflow }) => chatWorkflow.viewerId)

  return <span>{viewerId}</span>
}

test("given: an authenticated viewer, should: create isolated workflow state for the provider", () => {
  const store = createStore({
    ports: {
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
    shouldRunSagas: false,
  })

  render(
    <ChatStoreProviderComponent store={store} viewerId="viewer-1">
      <ViewerComponent />
    </ChatStoreProviderComponent>,
  )

  const actual = screen.getByText("viewer-1").textContent
  const expected = "viewer-1"

  expect(actual).toEqual(expected)
})

test("given: a changed chat draft, should: persist it through the saga port", async () => {
  const writeDraft = vi.fn()
  const store = createStore({
    ports: {
      drafts: {
        readDraft: () => "",
        removeDraft: () => undefined,
        writeDraft,
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
    shouldRunSagas: true,
  })
  const input = {
    conversationId: "conversation-1",
    draft: "Saved for later",
    viewerId: "viewer-1",
  }

  store.dispatch(changeChatDraft(input))

  await waitFor(() => expect(writeDraft).toHaveBeenCalledWith(input))
})
