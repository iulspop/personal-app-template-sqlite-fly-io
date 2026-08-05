import twilio from "twilio"

import { getServerEnv } from "../../../config/server-env.server"
import type { ChatDeliveryResult } from "./chat-email.server"

export function isOwnerChatSmsConfigured(recipientPhone?: string) {
  const env = getServerEnv()
  return Boolean(
    recipientPhone &&
      env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      env.TWILIO_FROM_NUMBER,
  )
}

export async function sendOwnerChatSms({
  dashboardUrl,
  recipientPhone,
}: {
  dashboardUrl: string
  recipientPhone: string
}): Promise<ChatDeliveryResult> {
  const env = getServerEnv()
  const accountSid = env.TWILIO_ACCOUNT_SID
  const authToken = env.TWILIO_AUTH_TOKEN
  const from = env.TWILIO_FROM_NUMBER
  if (!isOwnerChatSmsConfigured(recipientPhone))
    return { delivered: false, errorCode: "SMS_NOT_CONFIGURED" }

  try {
    const message = await twilio(accountSid, authToken).messages.create({
      body: `You have a new private chat message. Open the secure dashboard: ${dashboardUrl}`,
      from,
      to: recipientPhone,
    })
    return { delivered: true, providerId: message.sid }
  } catch (error) {
    const errorCode =
      typeof error === "object" && error && "code" in error
        ? `TWILIO_${String(error.code)}`
        : "SMS_FAILED"
    return { delivered: false, errorCode }
  }
}
