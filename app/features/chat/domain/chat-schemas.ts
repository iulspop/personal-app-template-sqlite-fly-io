import { z } from "zod"

import {
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_MIME_TYPES,
  CHAT_MESSAGE_MAX_LENGTH,
} from "./chat-constants"

export const chatMessageSchema = z.object({
  body: z.string().trim().max(CHAT_MESSAGE_MAX_LENGTH),
})

export const chatTypingSchema = z.object({
  conversationId: z.string().trim().min(1),
  isTyping: z.enum(["true", "false"]).transform((value) => value === "true"),
})

export const chatAttachmentSchema = z.object({
  byteSize: z.number().int().positive().max(CHAT_ATTACHMENT_MAX_BYTES),
  mimeType: z.enum(CHAT_ATTACHMENT_MIME_TYPES),
  originalName: z.string().trim().min(1).max(255),
})

export function validateChatMessageContent({
  attachmentCount,
  body,
}: {
  attachmentCount: number
  body: string
}) {
  const result = chatMessageSchema.safeParse({ body })
  if (!result.success) return result
  if (result.data.body.length === 0 && attachmentCount === 0) {
    return {
      error: new z.ZodError([
        {
          code: "custom",
          message: "Enter a message or attach a file.",
          path: ["body"],
        },
      ]),
      success: false as const,
    }
  }
  return result
}
