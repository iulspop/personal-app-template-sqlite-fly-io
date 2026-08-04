import { describe, expect, test } from "vitest"

import {
  canAccessConversation,
  countUnreadMessages,
  formatPresence,
  isOwnerEmailAllowed,
  isUserOnline,
  parseOwnerEmailAllowlist,
} from "./chat-domain"

describe("canAccessConversation()", () => {
  const conversation = { ownerId: "owner-id", userId: "user-id" }

  test("given: the conversation owner, should: allow access", () => {
    const actual = canAccessConversation("owner-id", conversation)
    const expected = true

    expect(actual).toEqual(expected)
  })

  test("given: the conversation user, should: allow access", () => {
    const actual = canAccessConversation("user-id", conversation)
    const expected = true

    expect(actual).toEqual(expected)
  })

  test("given: another user, should: deny access", () => {
    const actual = canAccessConversation("other-id", conversation)
    const expected = false

    expect(actual).toEqual(expected)
  })
})

describe("countUnreadMessages()", () => {
  test("given: messages around the read watermark, should: count only unread messages from the other participant", () => {
    const messages = [
      { createdAt: new Date("2026-07-17T10:00:00Z"), senderId: "other-id" },
      { createdAt: new Date("2026-07-17T10:02:00Z"), senderId: "viewer-id" },
      { createdAt: new Date("2026-07-17T10:03:00Z"), senderId: "other-id" },
    ]

    const actual = countUnreadMessages({
      messages,
      readAt: new Date("2026-07-17T10:01:00Z"),
      viewerId: "viewer-id",
    })
    const expected = 1

    expect(actual).toEqual(expected)
  })
})

describe("isUserOnline()", () => {
  const now = new Date("2026-07-17T10:00:45Z")

  test("given: a heartbeat exactly at the threshold, should: report online", () => {
    const actual = isUserOnline(new Date("2026-07-17T10:00:00Z"), now, 45_000)
    const expected = true

    expect(actual).toEqual(expected)
  })

  test("given: an expired heartbeat, should: report offline", () => {
    const actual = isUserOnline(new Date("2026-07-17T09:59:59Z"), now, 45_000)
    const expected = false

    expect(actual).toEqual(expected)
  })
})

describe("formatPresence()", () => {
  const now = new Date("2026-07-17T12:00:00Z")

  test("given: no heartbeat, should: format offline", () => {
    const actual = formatPresence(null, now)
    const expected = "Offline"

    expect(actual).toEqual(expected)
  })

  test("given: a recent heartbeat, should: format online", () => {
    const actual = formatPresence(new Date("2026-07-17T11:59:30Z"), now)
    const expected = "Online"

    expect(actual).toEqual(expected)
  })

  test("given: a heartbeat two hours ago, should: format hours", () => {
    const actual = formatPresence(new Date("2026-07-17T10:00:00Z"), now)
    const expected = "Last seen 2h ago"

    expect(actual).toEqual(expected)
  })
})

describe("owner email allowlist", () => {
  test("given: mixed-case comma-separated emails, should: normalize them", () => {
    const actual = parseOwnerEmailAllowlist(
      " Owner@Example.com, second@example.com ",
    )
    const expected = new Set(["owner@example.com", "second@example.com"])

    expect(actual).toEqual(expected)
  })

  test("given: an allowed email with different casing, should: allow owner claim", () => {
    const allowedEmails = parseOwnerEmailAllowlist("owner@example.com")
    const actual = isOwnerEmailAllowed("OWNER@example.com", allowedEmails)
    const expected = true

    expect(actual).toEqual(expected)
  })
})
