import { useEffect, useRef } from "react"
import { useRevalidator } from "react-router"

import { selectChatSnapshotSequence } from "./chat-workflow-selectors"
import { useAppSelector } from "~/store/store-provider"

export function ChatRevalidationBridgeComponent() {
  const sequence = useAppSelector(selectChatSnapshotSequence)
  const previousSequence = useRef(sequence)
  const { revalidate } = useRevalidator()

  useEffect(() => {
    if (sequence > previousSequence.current) revalidate()
    previousSequence.current = sequence
  }, [revalidate, sequence])

  return null
}
