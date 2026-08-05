import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import * as s from "./chat-notification-provider.css"
import { ChatRevalidationBridgeComponent } from "./chat-workflow/chat-revalidation-bridge"
import { dismissChatNotification } from "./chat-workflow/chat-workflow-actions"
import {
  selectChatConnectionStatus,
  selectChatSnapshotSequence,
  selectChatUnreadCount,
  selectIsChatNotificationVisible,
} from "./chat-workflow/chat-workflow-selectors"
import { Button } from "~/components/ui/button"
import { useAppDispatch, useAppSelector } from "~/store/store-provider"

export function ChatNotificationProvider({
  children,
}: {
  children: ReactNode
}) {
  const dispatch = useAppDispatch()
  const connectionStatus = useAppSelector(selectChatConnectionStatus)
  const isNotificationVisible = useAppSelector(selectIsChatNotificationVisible)
  const sequence = useAppSelector(selectChatSnapshotSequence)
  const unreadCount = useAppSelector(selectChatUnreadCount)
  const [announcement, setAnnouncement] = useState("")

  useEffect(() => {
    if (sequence === 0) return
    setAnnouncement(
      unreadCount > 0
        ? `You have ${unreadCount} unread chat messages.`
        : "Chat updated.",
    )
  }, [sequence, unreadCount])

  const connectionMessage =
    connectionStatus === "offline"
      ? "Chat is offline. Updates will resume when your connection returns."
      : connectionStatus === "reconnecting"
        ? "Reconnecting to chat…"
        : null

  return (
    <>
      <ChatRevalidationBridgeComponent />
      {children}
      <div aria-live="polite" className={s.visuallyHidden}>
        {announcement}
      </div>
      {connectionMessage !== null && (
        <div aria-live="polite" className={s.visuallyHidden}>
          {connectionMessage}
        </div>
      )}
      {isNotificationVisible && (
        <aside aria-label="Chat notification" className={s.toast}>
          <p className={s.title}>New founder chat activity</p>
          <p className={s.detail}>
            {unreadCount} unread {unreadCount === 1 ? "message" : "messages"}
          </p>
          <Button
            className={s.dismiss}
            onClick={() => dispatch(dismissChatNotification())}
            type="button"
            variant="ghost"
          >
            Dismiss
          </Button>
        </aside>
      )}
    </>
  )
}
