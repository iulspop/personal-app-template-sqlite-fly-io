import { Provider } from "react-redux"
import { createRoutesStub } from "react-router"
import { describe, expect, test, vi } from "vitest"

import type { ChatWorkflowPorts } from "../domain/chat-workflow-ports"
import type { ChatThreadMessage } from "./chat-thread"
import { ChatThread } from "./chat-thread"
import {
  receiveChatSnapshot,
  restoreChatDraft,
} from "./chat-workflow/chat-workflow-actions"
import { createStore } from "~/store/create-store"
import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
} from "~/test/react-test-utils"

const identity = { conversationId: "conversation-id", viewerId: "viewer-id" }

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

const createProps = (
  overrides: Partial<{
    backTo: string
    messages: ChatThreadMessage[]
    participant: string
    presence: string
    title: string
  }> = {},
) => ({
  ...identity,
  backTo: "/",
  messages: [],
  participant: "owner@example.com",
  presence: "Online",
  title: "Chat with founder",
  ...overrides,
})

const renderChatThread = ({
  action = () => ({ error: null, messageId: "message-id" }),
  draft = "",
}: {
  action?: () => { error: string | null; messageId?: string }
  draft?: string
} = {}) => {
  const store = createStore({ ports: createPorts(), shouldRunSagas: false })
  if (draft) store.dispatch(restoreChatDraft({ ...identity, draft }))
  const RouterStub = createRoutesStub([
    {
      action,
      Component: () => (
        <Provider store={store}>
          <ChatThread {...createProps()} />
        </Provider>
      ),
      path: "/chat",
    },
  ])
  render(<RouterStub initialEntries={["/chat"]} />)
  return { store }
}

describe("ChatThread", () => {
  test("given: a persisted draft, should: restore the message body", () => {
    renderChatThread({ draft: "Saved for later" })

    expect(screen.getByRole("textbox", { name: /message/i })).toHaveValue(
      "Saved for later",
    )
  })

  test("given: the participant is typing, should: announce the typing state", () => {
    const { store } = renderChatThread()

    act(() => {
      store.dispatch(
        receiveChatSnapshot({
          latestAt: null,
          typingConversationIds: [identity.conversationId],
          unreadCount: 0,
        }),
      )
    })

    expect(screen.getByText("Founder is typing…")).toBeVisible()
  })

  test("given: a message is sent successfully, should: clear the composer", async () => {
    const user = userEvent.setup()
    renderChatThread()
    const messageInput = screen.getByRole("textbox", { name: /message/i })

    await user.type(messageInput, "Hello owner")
    await user.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() => expect(messageInput).toHaveValue(""))
  })

  test("given: sending fails, should: preserve the message", async () => {
    const user = userEvent.setup()
    renderChatThread({
      action: () => ({ error: "Message could not be sent." }),
    })
    const messageInput = screen.getByRole("textbox", { name: /message/i })

    await user.type(messageInput, "Try again")
    await user.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() => expect(messageInput).toHaveValue("Try again"))
  })

  test("given: files are selected, should: show and remove them before sending", async () => {
    const user = userEvent.setup()
    renderChatThread()
    const fileInput = screen.getByLabelText(/attach files/i)
    const screenshot = new File(["image"], "roadmap.png", {
      type: "image/png",
    })

    await user.upload(fileInput, screenshot)

    expect(
      screen.getByRole("list", { name: /files ready to send/i }),
    ).toBeVisible()
    expect(screen.getByText("roadmap.png")).toBeVisible()

    await user.click(
      screen.getByRole("button", { name: /remove roadmap.png/i }),
    )

    expect(screen.queryByText("roadmap.png")).not.toBeInTheDocument()
    expect((fileInput as HTMLInputElement).files).toHaveLength(0)
  })

  test("given: a composed message, should: send when Enter is pressed", async () => {
    const user = userEvent.setup()
    const action = vi.fn(() => ({ error: null, messageId: "message-id" }))
    renderChatThread({ action })
    const messageInput = screen.getByRole("textbox", { name: /message/i })

    await user.type(messageInput, "Send with Enter{Enter}")

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(messageInput).toHaveValue(""))
  })

  test("given: a composed message, should: add a newline with Shift+Enter", async () => {
    const user = userEvent.setup()
    const action = vi.fn(() => ({ error: null, messageId: "message-id" }))
    renderChatThread({ action })
    const messageInput = screen.getByRole("textbox", { name: /message/i })

    await user.type(
      messageInput,
      "First line{Shift>}{Enter}{/Shift}Second line",
    )

    expect(messageInput).toHaveValue("First line\nSecond line")
    expect(action).not.toHaveBeenCalled()
  })
})
