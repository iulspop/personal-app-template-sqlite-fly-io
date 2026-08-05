import { describe, expect, test } from "vitest"

import {
  createSourceSlotMarkers,
  listSourceSlots,
  removeSourceSlot,
  replaceSourceSlot,
} from "./source-slots"

const createSource = () => {
  const { begin, end } = createSourceSlotMarkers({
    contribution: "founderChatNavigation",
    slot: "primaryNavigation",
  })

  return [
    `before`,
    `// ${begin}`,
    `feature content`,
    `// ${end}`,
    `after`,
  ].join("\n")
}

describe("source slots", () => {
  test("given: one exact source slot, should: replace its complete block", () => {
    const actual = replaceSourceSlot({
      content: createSource(),
      contribution: "founderChatNavigation",
      replacement: "replacement content",
      slot: "primaryNavigation",
    })
    const expected = "before\nreplacement content\nafter"

    expect(actual).toEqual(expected)
  })

  test("given: one exact source slot, should: remove its complete block", () => {
    const actual = removeSourceSlot({
      content: createSource(),
      contribution: "founderChatNavigation",
      slot: "primaryNavigation",
    })
    const expected = "before\nafter"

    expect(actual).toEqual(expected)
  })

  test("given: another contribution with the same prefix, should: ignore it", () => {
    const content = `${createSource()}\n// FEATURE_SLOT_BEGIN:primaryNavigation:founderChatNavigationImports\nimports\n// FEATURE_SLOT_END:primaryNavigation:founderChatNavigationImports`

    const actual = removeSourceSlot({
      content,
      contribution: "founderChatNavigation",
      slot: "primaryNavigation",
    })
    const expected =
      "before\nafter\n// FEATURE_SLOT_BEGIN:primaryNavigation:founderChatNavigationImports\nimports\n// FEATURE_SLOT_END:primaryNavigation:founderChatNavigationImports"

    expect(actual).toEqual(expected)
  })

  test("given: HTML comment markers, should: remove the documentation block", () => {
    const contribution = `${"todos"}Docs`
    const { begin, end } = createSourceSlotMarkers({
      contribution,
      slot: "documentation",
    })
    const content = [
      "before",
      `<!-- ${begin} -->`,
      "Todo documentation",
      `<!-- ${end} -->`,
      "after",
    ].join("\n")

    const actual = removeSourceSlot({
      content,
      contribution,
      slot: "documentation",
    })
    const expected = "before\nafter"

    expect(actual).toEqual(expected)
  })

  test("given: stale or duplicate markers, should: reject the transformation", () => {
    const source = createSource()
    const transform = (content: string) => () =>
      removeSourceSlot({
        content,
        contribution: "founderChatNavigation",
        slot: "primaryNavigation",
      })

    expect(transform("without markers")).toThrowError(
      'Expected exactly one source slot "primaryNavigation:founderChatNavigation", found 0',
    )
    expect(transform(`${source}\n${source}`)).toThrowError(
      'Expected exactly one source slot "primaryNavigation:founderChatNavigation", found 2',
    )
  })

  test("given: marked source content, should: inventory its source slots", () => {
    const actual = listSourceSlots(createSource())
    const expected = [
      {
        contribution: "founderChatNavigation",
        slot: "primaryNavigation",
      },
    ]

    expect(actual).toEqual(expected)
  })
})
