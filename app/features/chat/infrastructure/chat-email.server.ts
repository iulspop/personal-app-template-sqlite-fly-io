import { Resend } from "resend"

import { getServerEnv } from "../../../config/server-env.server"

export type ChatDeliveryResult =
  | { delivered: true; providerId: string | null }
  | { delivered: false; errorCode: string }

export async function sendOwnerChatEmail({
  dashboardUrl,
  recipientEmail,
  senderEmail,
}: {
  dashboardUrl: string
  recipientEmail: string
  senderEmail: string
}): Promise<ChatDeliveryResult> {
  const env = getServerEnv()
  if (env.NODE_ENV === "development")
    return { delivered: false, errorCode: "EMAIL_DISABLED_IN_DEVELOPMENT" }
  if (!env.RESEND_API_KEY)
    return { delivered: false, errorCode: "EMAIL_NOT_CONFIGURED" }

  try {
    const result = await new Resend(env.RESEND_API_KEY).emails.send({
      from: env.EMAIL_FROM,
      html: `<p>You have a new private chat message from ${escapeHtml(senderEmail)}.</p><p><a href="${escapeHtml(dashboardUrl)}">Open the secure chat dashboard</a></p>`,
      subject: "New private chat message",
      text: `You have a new private chat message from ${senderEmail}. Open the secure dashboard: ${dashboardUrl}`,
      to: recipientEmail,
    })
    if (result.error)
      return {
        delivered: false,
        errorCode: result.error.name || "EMAIL_FAILED",
      }
    return { delivered: true, providerId: result.data?.id ?? null }
  } catch {
    return { delivered: false, errorCode: "EMAIL_FAILED" }
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "'": "&#039;",
      '"': "&quot;",
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
    }
    return entities[character] ?? character
  })
}
