import { data } from "react-router"

import type { Route } from "./+types/chat.typing"
import { requireUserId } from "~/features/auth/application/auth-session.server"
import { CHAT_TYPING_EXPIRY_MS } from "~/features/chat/domain/chat-constants"
import { chatTypingSchema } from "~/features/chat/domain/chat-schemas"
import {
  deleteChatTypingStateFromDatabaseByConversationIdAndUserId,
  retrieveConversationForParticipant,
  saveChatTypingStateToDatabase,
} from "~/features/chat/infrastructure/chat-model.server"

const privateHeaders = { "Cache-Control": "private, no-store" }
const failure = () =>
  data(
    { error: "Unable to update typing state." },
    { headers: privateHeaders, status: 404 },
  )

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  const result = chatTypingSchema.safeParse(Object.fromEntries(formData))

  if (!result.success) return failure()

  const { conversationId, isTyping } = result.data
  const conversation = await retrieveConversationForParticipant({
    conversationId,
    requesterId: userId,
  })
  if (!conversation) return failure()

  if (isTyping) {
    await saveChatTypingStateToDatabase({
      conversationId,
      expiresAt: new Date(Date.now() + CHAT_TYPING_EXPIRY_MS),
      userId,
    })
  } else {
    await deleteChatTypingStateFromDatabaseByConversationIdAndUserId({
      conversationId,
      userId,
    })
  }

  return data({ success: true }, { headers: privateHeaders })
}
