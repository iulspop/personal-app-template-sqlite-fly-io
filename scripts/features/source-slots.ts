export type SourceSlotReference = {
  contribution: string
  slot: string
}

const sourceSlotPrefix = "FEATURE_SLOT"

export const createSourceSlotMarkers = ({
  contribution,
  slot,
}: SourceSlotReference) => ({
  begin: `${sourceSlotPrefix}_BEGIN:${slot}:${contribution}`,
  end: `${sourceSlotPrefix}_END:${slot}:${contribution}`,
})

const findMarkerLines = ({
  content,
  marker,
}: {
  content: string
  marker: string
}) =>
  content
    .split("\n")
    .map((line, index) => ({ index, line }))
    .filter(({ line }) => {
      const trimmedLine = line.trim()
      return (
        trimmedLine.endsWith(marker) || trimmedLine === `<!-- ${marker} -->`
      )
    })
    .map(({ index }) => index)

const findSourceSlotRange = ({
  content,
  contribution,
  slot,
}: {
  content: string
} & SourceSlotReference) => {
  const { begin, end } = createSourceSlotMarkers({ contribution, slot })
  const beginLines = findMarkerLines({ content, marker: begin })
  const endLines = findMarkerLines({ content, marker: end })
  const count = Math.max(beginLines.length, endLines.length)

  if (
    beginLines.length !== 1 ||
    endLines.length !== 1 ||
    beginLines[0] >= endLines[0]
  ) {
    throw new Error(
      `Expected exactly one source slot "${slot}:${contribution}", found ${count}`,
    )
  }

  return { end: endLines[0], start: beginLines[0] }
}

export const replaceSourceSlot = ({
  content,
  contribution,
  replacement,
  slot,
}: {
  content: string
  replacement: string
} & SourceSlotReference) => {
  const lines = content.split("\n")
  const { end, start } = findSourceSlotRange({ content, contribution, slot })

  return [
    ...lines.slice(0, start),
    ...(replacement === "" ? [] : replacement.split("\n")),
    ...lines.slice(end + 1),
  ].join("\n")
}

export const removeSourceSlot = ({
  content,
  contribution,
  slot,
}: {
  content: string
} & SourceSlotReference) =>
  replaceSourceSlot({ content, contribution, replacement: "", slot })

export const listSourceSlots = (content: string): SourceSlotReference[] =>
  content.split("\n").flatMap((line) => {
    const marker = line.match(
      /FEATURE_SLOT_BEGIN:([a-zA-Z][a-zA-Z0-9]*):([a-z][A-Za-z0-9]*)/,
    )

    return marker
      ? [
          {
            contribution: marker[2],
            slot: marker[1] as SourceSlotReference["slot"],
          },
        ]
      : []
  })
