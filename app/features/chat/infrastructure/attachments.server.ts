import { createReadStream, createWriteStream } from "node:fs"
import { mkdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { Readable, Transform } from "node:stream"
import { pipeline } from "node:stream/promises"
import { createId } from "@paralleldrive/cuid2"

import { getServerEnv } from "../../../config/server-env.server"
import {
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_MIME_TYPES,
} from "../domain/chat-constants"

const extensionByMimeType = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
} as const

export const chatAttachmentDirectory = getServerEnv().CHAT_ATTACHMENT_DIRECTORY

function detectMimeType(bytes: Buffer) {
  if (bytes.subarray(0, 4).equals(Buffer.from("%PDF"))) return "application/pdf"
  if (
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "image/png"
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg"
  if (
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP"
  )
    return "image/webp"
  return null
}

export async function saveChatAttachment(file: File) {
  if (file.size <= 0 || file.size > CHAT_ATTACHMENT_MAX_BYTES)
    throw new Error("INVALID_ATTACHMENT_SIZE")
  if (!CHAT_ATTACHMENT_MIME_TYPES.includes(file.type as never))
    throw new Error("INVALID_ATTACHMENT_TYPE")

  await mkdir(chatAttachmentDirectory, { recursive: true })
  const id = createId()
  const storageName = `${id}${extensionByMimeType[file.type as keyof typeof extensionByMimeType]}`
  const path = join(chatAttachmentDirectory, storageName)
  let byteSize = 0
  let header = Buffer.alloc(0)

  const validator = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      byteSize += chunk.length
      if (byteSize > CHAT_ATTACHMENT_MAX_BYTES) {
        callback(new Error("INVALID_ATTACHMENT_SIZE"))
        return
      }
      if (header.length < 16)
        header = Buffer.concat([header, chunk]).subarray(0, 16)
      callback(null, chunk)
    },
  })

  try {
    await pipeline(
      Readable.fromWeb(file.stream() as never),
      validator,
      createWriteStream(path, { flags: "wx" }),
    )
    if (detectMimeType(header) !== file.type)
      throw new Error("INVALID_ATTACHMENT_CONTENT")
  } catch (error) {
    await rm(path, { force: true })
    throw error
  }

  return {
    byteSize,
    id,
    mimeType: file.type,
    originalName: file.name,
    path,
    storageName,
  }
}

export function openChatAttachment(storageName: string) {
  if (!/^[a-z0-9]+\.(jpg|pdf|png|webp)$/.test(storageName)) return null
  return createReadStream(join(chatAttachmentDirectory, storageName))
}

export function deleteChatAttachment(storageName: string) {
  if (!/^[a-z0-9]+\.(jpg|pdf|png|webp)$/.test(storageName)) return
  return rm(join(chatAttachmentDirectory, storageName), { force: true })
}
