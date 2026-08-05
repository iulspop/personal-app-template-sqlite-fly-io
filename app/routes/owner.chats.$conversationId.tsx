import { redirect } from "react-router"

import type { Route } from "./+types/owner.chats.$conversationId"
import { requireUserId } from "~/features/auth/application/auth-session.server"
import {
  formatPresence,
  handleChatMessageAction,
  markConversationRead,
  serializeChatThread,
} from "~/features/chat/application/chat-route.server"
import { ChatThread } from "~/features/chat/application/chat-thread"
import * as layout from "~/features/chat/application/owner-chat-layout.css"
import {
  retrieveConversationMessages,
  retrieveOwnerStatusForUser,
} from "~/features/chat/infrastructure/chat-model.server"

async function requireOwnerConversation(
  request: Request,
  conversationId: string,
) {
  const userId = await requireUserId(request)
  if (!(await retrieveOwnerStatusForUser(userId))) throw redirect("/")
  const thread = await retrieveConversationMessages({
    conversationId,
    requesterId: userId,
  })
  if (!thread || thread.conversation.ownerId !== userId)
    throw new Response("Not found", { status: 404 })
  return { thread, userId }
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { thread, userId } = await requireOwnerConversation(
    request,
    params.conversationId,
  )
  await markConversationRead({
    conversationId: params.conversationId,
    readerId: userId,
  })
  return {
    conversationId: params.conversationId,
    messages: serializeChatThread({ ...thread, requesterId: userId }),
    pageTitle: `Chat with ${thread.conversation.user.email}`,
    participantEmail: thread.conversation.user.email,
    participantPresence: formatPresence(thread.conversation.user.lastSeenAt),
    viewerId: userId,
  }
}

export async function action({ params, request }: Route.ActionArgs) {
  const { userId } = await requireOwnerConversation(
    request,
    params.conversationId,
  )
  return handleChatMessageAction({
    conversationId: params.conversationId,
    request,
    senderId: userId,
  })
}

export default function OwnerConversationRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <main className={layout.workspace}>
      <ChatThread
        backTo="/owner/chats"
        conversationId={loaderData.conversationId}
        messages={loaderData.messages}
        mobileFullHeight
        participant={loaderData.participantEmail}
        presence={loaderData.participantPresence}
        title="Private conversation"
        typingLabel={`${loaderData.participantEmail} is typing…`}
        viewerId={loaderData.viewerId}
      />
    </main>
  )
}
