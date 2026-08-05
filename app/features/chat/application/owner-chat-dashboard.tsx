import {
  IconArrowLeft,
  IconChevronRight,
  IconMessageCircle,
} from "@tabler/icons-react"
import { Link } from "react-router"

import { formatPresence } from "../domain/chat-domain"
import { selectChatTypingConversationIds } from "./chat-workflow/chat-workflow-selectors"
import * as s from "./owner-chat-dashboard.css"
import { useAppSelector } from "~/store/store-provider"

export type OwnerConversationSummary = {
  id: string
  latestMessage: { body: string; createdAt: string } | null
  unreadCount: number
  user: { email: string; lastSeenAt: string | null }
}

export function OwnerChatDashboard({
  conversations,
}: {
  conversations: OwnerConversationSummary[]
}) {
  const typingConversationIds = useAppSelector(selectChatTypingConversationIds)

  return (
    <section aria-labelledby="owner-inbox-title" className={s.page}>
      <header className={s.header}>
        <Link aria-label="Back to todos" className={s.backLink} to="/">
          <IconArrowLeft aria-hidden="true" size={18} stroke={1.8} />
        </Link>
        <div className={s.heading}>
          <h1 className={s.title} id="owner-inbox-title">
            Messages
          </h1>
          <p className={s.subtitle}>Founder inbox</p>
        </div>
      </header>

      {conversations.length === 0 ? (
        <div className={s.empty}>
          <IconMessageCircle aria-hidden="true" size={22} stroke={1.7} />
          <strong>No conversations yet</strong>
          <span>New messages from users will appear here.</span>
        </div>
      ) : (
        <ul aria-label="Conversations" className={s.list}>
          {conversations.map((conversation) => {
            const presence = formatPresence(
              conversation.user.lastSeenAt
                ? new Date(conversation.user.lastSeenAt)
                : null,
            )
            return (
              <li className={s.listItem} key={conversation.id}>
                <Link
                  className={s.conversation}
                  to={`/owner/chats/${conversation.id}`}
                >
                  <span aria-hidden="true" className={s.avatar}>
                    {conversation.user.email.slice(0, 1).toUpperCase()}
                  </span>
                  <span className={s.conversationMain}>
                    <span className={s.conversationTopline}>
                      <strong>{conversation.user.email}</strong>
                      {conversation.latestMessage && (
                        <time dateTime={conversation.latestMessage.createdAt}>
                          {new Date(
                            conversation.latestMessage.createdAt,
                          ).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </time>
                      )}
                    </span>
                    <span className={s.conversationBottomline}>
                      <span className={s.preview}>
                        {typingConversationIds.includes(conversation.id)
                          ? "Typing…"
                          : conversation.latestMessage?.body || "Attachment"}
                      </span>
                      <span className={s.presence}>{presence}</span>
                    </span>
                  </span>
                  {conversation.unreadCount > 0 ? (
                    <span className={s.badge}>
                      <span aria-hidden="true">{conversation.unreadCount}</span>
                      <span className={s.visuallyHidden}>
                        {conversation.unreadCount} unread messages
                      </span>
                    </span>
                  ) : (
                    <IconChevronRight
                      aria-hidden="true"
                      className={s.chevron}
                      size={17}
                      stroke={1.8}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
