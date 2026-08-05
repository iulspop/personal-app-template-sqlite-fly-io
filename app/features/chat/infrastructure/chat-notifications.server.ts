import { getServerEnv } from "../../../config/server-env.server"
import { CHAT_NOTIFICATION_COOLDOWN_MS } from "../domain/chat-constants"
import { sendOwnerChatEmail } from "./chat-email.server"
import {
  createChatNotification,
  retrieveRecentChatNotification,
} from "./chat-model.server"
import { isOwnerChatSmsConfigured, sendOwnerChatSms } from "./chat-sms.server"

type NotificationChannel = "email" | "sms"

export async function notifyOwnerOfChatMessage({
  dashboardUrl,
  messageId,
  now = new Date(),
  ownerEmail,
  ownerId,
  ownerPhone = getServerEnv().OWNER_PHONE_NUMBER,
  senderEmail,
}: {
  dashboardUrl: string
  messageId: string
  now?: Date
  ownerEmail: string
  ownerId: string
  ownerPhone?: string
  senderEmail: string
}) {
  const after = new Date(now.getTime() - CHAT_NOTIFICATION_COOLDOWN_MS)
  const channels: NotificationChannel[] = ["email"]
  if (isOwnerChatSmsConfigured(ownerPhone)) channels.push("sms")

  const results = await Promise.all(
    channels.map(async (channel) => {
      try {
        const recent = await retrieveRecentChatNotification({
          after,
          channel,
          recipientId: ownerId,
        })
        if (recent) return { channel, status: "suppressed" as const }

        const result =
          channel === "email"
            ? await sendOwnerChatEmail({
                dashboardUrl,
                recipientEmail: ownerEmail,
                senderEmail,
              })
            : await sendOwnerChatSms({
                dashboardUrl,
                recipientPhone: ownerPhone ?? "",
              })
        await createChatNotification({
          attemptedAt: now,
          channel,
          errorCode: result.delivered ? null : result.errorCode,
          messageId,
          recipientId: ownerId,
          status: result.delivered ? "delivered" : "failed",
        })
        return {
          channel,
          status: result.delivered
            ? ("delivered" as const)
            : ("failed" as const),
        }
      } catch {
        return { channel, status: "failed" as const }
      }
    }),
  )

  return results
}
