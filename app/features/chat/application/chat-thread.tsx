import {
  IconArrowLeft,
  IconFile,
  IconPaperclip,
  IconSend,
  IconX,
} from "@tabler/icons-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useFetcher } from "react-router"

import * as s from "./chat-thread.css"
import {
  changeChatDraft,
  clearChatDraft,
  closeChatThread,
  openChatThread,
  publishChatTyping,
  stopChatTyping,
} from "./chat-workflow/chat-workflow-actions"
import {
  selectChatDraft,
  selectChatTypingConversationIds,
} from "./chat-workflow/chat-workflow-selectors"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { CHAT_SEND_MESSAGE_INTENT } from "~/features/chat/domain/chat-constants"
import { useAppDispatch, useAppSelector } from "~/store/store-provider"

export type ChatThreadMessage = {
  attachments: Array<{ id: string; originalName: string }>
  body: string
  createdAt: string
  id: string
  isMine: boolean
  isRead: boolean
}

export function ChatThread({
  backTo,
  conversationId,
  messages,
  mobileFullHeight = false,
  participant,
  presence,
  title,
  typingLabel = "Founder is typing…",
  viewerId,
}: {
  backTo: string
  conversationId: string
  messages: ChatThreadMessage[]
  mobileFullHeight?: boolean
  participant: string
  presence: string
  title: string
  typingLabel?: string
  viewerId: string
}) {
  const [announcement, setAnnouncement] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{ file: File; id: string }>
  >([])
  const composerRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesRef = useRef<HTMLOListElement>(null)
  const sendButtonRef = useRef<HTMLButtonElement>(null)
  const fetcher = useFetcher<{ error: string | null; messageId?: string }>()
  const dispatch = useAppDispatch()
  const identity = useMemo(
    () => ({ conversationId, viewerId }),
    [conversationId, viewerId],
  )
  const draft = useAppSelector((state) => selectChatDraft(state, identity))
  const typingConversationIds = useAppSelector(selectChatTypingConversationIds)
  const isParticipantTyping = typingConversationIds.includes(conversationId)

  useEffect(() => {
    dispatch(openChatThread(identity))
    return () => {
      dispatch(stopChatTyping(identity))
      dispatch(closeChatThread(identity))
    }
  }, [dispatch, identity])

  useEffect(() => {
    if (fetcher.data?.error === null) {
      dispatch(stopChatTyping(identity))
      dispatch(clearChatDraft(identity))
      composerRef.current?.reset()
      setAnnouncement("Message sent.")
      setSelectedFiles([])
    }
  }, [dispatch, fetcher.data, identity])

  useEffect(() => {
    messagesRef.current?.scrollTo({
      behavior: "smooth",
      top: messagesRef.current.scrollHeight,
    })
  })

  const removeSelectedFile = (index: number) => {
    const nextFiles = selectedFiles.filter(
      (_, fileIndex) => fileIndex !== index,
    )
    const transfer = new DataTransfer()
    for (const { file } of nextFiles) transfer.items.add(file)
    if (fileInputRef.current) {
      try {
        fileInputRef.current.files = transfer.files
      } catch {
        Object.defineProperty(fileInputRef.current, "files", {
          configurable: true,
          value: transfer.files,
        })
      }
    }
    setSelectedFiles(nextFiles)
  }

  return (
    <section
      aria-label={title}
      className={mobileFullHeight ? s.mobileFullHeight : s.page}
    >
      <header className={s.header}>
        <Link
          aria-label="Back to conversations"
          className={s.backLink}
          to={backTo}
        >
          <IconArrowLeft aria-hidden="true" size={18} stroke={1.8} />
        </Link>
        <span aria-hidden="true" className={s.avatar}>
          {participant.slice(0, 1).toUpperCase()}
        </span>
        <div className={s.identity}>
          <h1 className={s.title}>{title}</h1>
          <p className={s.presence}>
            <span aria-hidden="true" className={s.presenceDot} />
            <span className={s.participant}>{participant}</span>
            <span aria-hidden="true"> · </span>
            {presence}
          </p>
        </div>
      </header>

      <ol aria-label="Chat messages" className={s.messages} ref={messagesRef}>
        {messages.length === 0 && (
          <li className={s.empty}>
            <strong>Start the conversation</strong>
            <span>Messages stay private between you and the founder.</span>
          </li>
        )}
        {messages.map((message) => (
          <li className={message.isMine ? s.mine : s.theirs} key={message.id}>
            <div className={s.bubble}>
              {message.body && <p className={s.body}>{message.body}</p>}
              {message.attachments.map((attachment) => (
                <a
                  className={s.attachment}
                  href={`/chat/attachments/${attachment.id}`}
                  key={attachment.id}
                >
                  <IconFile aria-hidden="true" size={16} stroke={1.8} />
                  <span>{attachment.originalName}</span>
                </a>
              ))}
            </div>
            <small className={s.receipt}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
              {message.isMine && message.isRead ? " · Read" : ""}
            </small>
          </li>
        ))}
      </ol>

      <p aria-live="polite" className={s.typingStatus}>
        {isParticipantTyping ? typingLabel : ""}
      </p>

      <fetcher.Form
        className={s.composer}
        encType="multipart/form-data"
        method="post"
        ref={composerRef}
      >
        {selectedFiles.length > 0 && (
          <ul aria-label="Files ready to send" className={s.selectedFiles}>
            {selectedFiles.map(({ file, id }, index) => (
              <li className={s.selectedFile} key={id}>
                <IconFile aria-hidden="true" size={15} stroke={1.8} />
                <span className={s.selectedFileName}>{file.name}</span>
                <button
                  aria-label={`Remove ${file.name}`}
                  className={s.removeFileButton}
                  onClick={() => removeSelectedFile(index)}
                  type="button"
                >
                  <IconX aria-hidden="true" size={14} stroke={1.8} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className={s.fileButton} htmlFor="chat-files">
          <IconPaperclip aria-hidden="true" size={19} stroke={1.8} />
          <span className={s.visuallyHidden}>
            Attach files. PNG, JPEG, WebP, or PDF; up to 10 MB each.
          </span>
        </label>
        <input
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className={s.fileInput}
          id="chat-files"
          multiple
          name="attachments"
          onChange={(event) =>
            setSelectedFiles(
              Array.from(event.currentTarget.files ?? []).map((file) => ({
                file,
                id: crypto.randomUUID(),
              })),
            )
          }
          ref={fileInputRef}
          type="file"
        />
        <label className={s.visuallyHidden} htmlFor="chat-message">
          Message
        </label>
        <Textarea
          className={s.messageInput}
          id="chat-message"
          maxLength={4000}
          name="body"
          onBlur={() => dispatch(stopChatTyping(identity))}
          onChange={(event) => {
            const nextDraft = event.currentTarget.value
            dispatch(changeChatDraft({ ...identity, draft: nextDraft }))
            dispatch(
              nextDraft.trim()
                ? publishChatTyping(identity)
                : stopChatTyping(identity),
            )
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              composerRef.current?.requestSubmit(sendButtonRef.current)
            }
          }}
          placeholder="Write a message…"
          rows={1}
          value={draft}
        />
        <Button
          aria-label="Send message"
          className={s.sendButton}
          disabled={fetcher.state !== "idle"}
          name="intent"
          ref={sendButtonRef}
          size="icon"
          type="submit"
          value={CHAT_SEND_MESSAGE_INTENT}
        >
          <IconSend aria-hidden="true" size={18} stroke={1.9} />
        </Button>
        {fetcher.data?.error && (
          <p className={s.error} role="alert">
            {fetcher.data.error}
          </p>
        )}
      </fetcher.Form>
      <div aria-live="polite" className={s.liveRegion}>
        {announcement}
      </div>
    </section>
  )
}
