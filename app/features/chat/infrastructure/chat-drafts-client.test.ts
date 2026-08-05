import { describe, expect, test } from "vitest"

import { createChatDraftsClient } from "./chat-drafts-client"

const createStorage = () => {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

describe("createChatDraftsClient()", () => {
  test("given: account and conversation identifiers, should: persist isolated drafts", () => {
    const client = createChatDraftsClient({ storage: createStorage() })

    client.writeDraft({
      conversationId: "conversation-1",
      draft: "First draft",
      viewerId: "viewer-1",
    })
    client.writeDraft({
      conversationId: "conversation-1",
      draft: "Second draft",
      viewerId: "viewer-2",
    })

    const actual = [
      client.readDraft({
        conversationId: "conversation-1",
        viewerId: "viewer-1",
      }),
      client.readDraft({
        conversationId: "conversation-1",
        viewerId: "viewer-2",
      }),
    ]
    const expected = ["First draft", "Second draft"]

    expect(actual).toEqual(expected)
  })

  test("given: a persisted draft, should: remove it", () => {
    const client = createChatDraftsClient({ storage: createStorage() })
    const identity = {
      conversationId: "conversation-1",
      viewerId: "viewer-1",
    }

    client.writeDraft({ ...identity, draft: "Draft" })
    client.removeDraft(identity)

    const actual = client.readDraft(identity)
    const expected = ""

    expect(actual).toEqual(expected)
  })

  test("given: unavailable storage, should: fail closed without exposing a draft", () => {
    const storage = {
      getItem: () => {
        throw new Error("unavailable")
      },
      removeItem: () => {
        throw new Error("unavailable")
      },
      setItem: () => {
        throw new Error("unavailable")
      },
    }
    const client = createChatDraftsClient({ storage })
    const identity = {
      conversationId: "conversation-1",
      viewerId: "viewer-1",
    }

    client.writeDraft({ ...identity, draft: "Draft" })
    client.removeDraft(identity)
    const actual = client.readDraft(identity)
    const expected = ""

    expect(actual).toEqual(expected)
  })
})
