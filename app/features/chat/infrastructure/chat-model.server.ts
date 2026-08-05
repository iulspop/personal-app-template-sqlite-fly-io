import type { Prisma } from "../../../../generated/prisma/client"
import { prisma } from "~/utils/db.server"

const messageInclude = {
  attachments: true,
  sender: { select: { email: true, id: true } },
} satisfies Prisma.ChatMessageInclude

export function retrieveOwnerClaim() {
  return prisma.ownerClaim.findUnique({
    include: { user: true },
    where: { singletonKey: 1 },
  })
}

export async function claimOwnerSeat(userId: string) {
  return prisma.ownerClaim.create({
    data: { singletonKey: 1, userId },
    include: { user: true },
  })
}

export function retrieveOwnerStatusForUser(userId: string) {
  return prisma.ownerClaim.findFirst({ where: { userId } })
}

export function retrieveOrCreateConversation({
  ownerId,
  userId,
}: {
  ownerId: string
  userId: string
}) {
  return prisma.chatConversation.upsert({
    create: { ownerId, userId },
    include: { owner: true, user: true },
    update: {},
    where: { userId },
  })
}

export function retrieveConversationForParticipant({
  conversationId,
  requesterId,
}: {
  conversationId: string
  requesterId: string
}) {
  return prisma.chatConversation.findFirst({
    include: { owner: true, user: true },
    where: {
      id: conversationId,
      OR: [{ ownerId: requesterId }, { userId: requesterId }],
    },
  })
}

export async function retrieveConversationMessages({
  before,
  conversationId,
  requesterId,
  take = 50,
}: {
  before?: string
  conversationId: string
  requesterId: string
  take?: number
}) {
  const conversation = await retrieveConversationForParticipant({
    conversationId,
    requesterId,
  })
  if (!conversation) return null

  const messages = await prisma.chatMessage.findMany({
    cursor: before ? { id: before } : undefined,
    include: messageInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: before ? 1 : 0,
    take,
    where: { conversationId },
  })

  return { conversation, messages: messages.reverse() }
}

export function createChatMessage({
  attachments = [],
  body,
  conversationId,
  senderId,
}: {
  attachments?: Array<{
    byteSize: number
    id: string
    mimeType: string
    originalName: string
    storageName: string
  }>
  body: string
  conversationId: string
  senderId: string
}) {
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.chatConversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ ownerId: senderId }, { userId: senderId }],
      },
    })
    if (!conversation) return null

    const message = await tx.chatMessage.create({
      data: {
        attachments: { create: attachments },
        body,
        conversationId,
        senderId,
      },
      include: messageInclude,
    })
    await tx.chatConversation.update({
      data: { updatedAt: message.createdAt },
      where: { id: conversationId },
    })
    return message
  })
}

export async function markConversationRead({
  conversationId,
  readerId,
  readAt = new Date(),
}: {
  conversationId: string
  readerId: string
  readAt?: Date
}) {
  const conversation = await retrieveConversationForParticipant({
    conversationId,
    requesterId: readerId,
  })
  if (!conversation) return null

  return prisma.chatConversation.update({
    data:
      conversation.ownerId === readerId
        ? { ownerReadAt: readAt }
        : { userReadAt: readAt },
    where: { id: conversationId },
  })
}

export async function countUnreadMessages({
  conversationId,
  readerId,
}: {
  conversationId: string
  readerId: string
}) {
  const conversation = await retrieveConversationForParticipant({
    conversationId,
    requesterId: readerId,
  })
  if (!conversation) return null

  const readAt =
    conversation.ownerId === readerId
      ? conversation.ownerReadAt
      : conversation.userReadAt

  return prisma.chatMessage.count({
    where: {
      conversationId,
      createdAt: readAt ? { gt: readAt } : undefined,
      senderId: { not: readerId },
    },
  })
}

export async function retrieveOwnerConversationSummaries(ownerId: string) {
  const conversations = await prisma.chatConversation.findMany({
    include: {
      messages: {
        include: messageInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
      },
      user: true,
    },
    orderBy: { updatedAt: "desc" },
    where: { ownerId },
  })

  return Promise.all(
    conversations.map(async (conversation) => ({
      ...conversation,
      latestMessage: conversation.messages[0] ?? null,
      unreadCount: await prisma.chatMessage.count({
        where: {
          conversationId: conversation.id,
          createdAt: conversation.ownerReadAt
            ? { gt: conversation.ownerReadAt }
            : undefined,
          senderId: { not: ownerId },
        },
      }),
    })),
  )
}

/**
 * Saves an expiring typing state to the database.
 * @param input - Conversation, participant, and expiry values.
 * @returns The saved chat typing state.
 */
export function saveChatTypingStateToDatabase({
  conversationId,
  expiresAt,
  userId,
}: {
  conversationId: string
  expiresAt: Date
  userId: string
}) {
  return prisma.chatTypingState.upsert({
    create: { conversationId, expiresAt, userId },
    update: { expiresAt },
    where: { conversationId_userId: { conversationId, userId } },
  })
}

/**
 * Deletes a participant's typing state from the database.
 * @param input - Conversation and participant identifiers.
 * @returns The deleted row count.
 */
export function deleteChatTypingStateFromDatabaseByConversationIdAndUserId({
  conversationId,
  userId,
}: {
  conversationId: string
  userId: string
}) {
  return prisma.chatTypingState.deleteMany({
    where: { conversationId, userId },
  })
}

/**
 * Retrieves fresh opposite-participant typing states for an authorized requester.
 * @param input - Conversation, requester, and current time values.
 * @returns Fresh typing states visible to the requester.
 */
export function retrieveChatTypingStatesFromDatabaseByConversationIdAndRequesterId({
  conversationId,
  now = new Date(),
  requesterId,
}: {
  conversationId: string
  now?: Date
  requesterId: string
}) {
  return prisma.chatTypingState.findMany({
    where: {
      conversation: {
        id: conversationId,
        OR: [{ ownerId: requesterId }, { userId: requesterId }],
      },
      expiresAt: { gt: now },
      userId: { not: requesterId },
    },
  })
}

export function retrieveChatTypingStatesFromDatabaseByRequesterId({
  now = new Date(),
  requesterId,
}: {
  now?: Date
  requesterId: string
}) {
  return prisma.chatTypingState.findMany({
    select: { conversationId: true },
    where: {
      conversation: {
        OR: [{ ownerId: requesterId }, { userId: requesterId }],
      },
      expiresAt: { gt: now },
      userId: { not: requesterId },
    },
  })
}

export function updateUserPresence(userId: string, lastSeenAt = new Date()) {
  return prisma.user.update({ data: { lastSeenAt }, where: { id: userId } })
}

export function createChatNotification(
  data: Prisma.ChatNotificationUncheckedCreateInput,
) {
  return prisma.chatNotification.create({ data })
}

export function retrieveRecentChatNotification({
  after,
  channel,
  recipientId,
}: {
  after: Date
  channel: string
  recipientId: string
}) {
  return prisma.chatNotification.findFirst({
    orderBy: { attemptedAt: "desc" },
    where: { attemptedAt: { gte: after }, channel, recipientId },
  })
}

export async function retrieveChatEventSnapshot(userId: string) {
  const typingConversationIds = (
    await retrieveChatTypingStatesFromDatabaseByRequesterId({
      requesterId: userId,
    })
  ).map(({ conversationId }) => conversationId)
  const ownerClaim = await retrieveOwnerStatusForUser(userId)
  if (ownerClaim) {
    const conversations = await retrieveOwnerConversationSummaries(userId)
    return {
      latestAt: conversations[0]?.updatedAt.toISOString() ?? null,
      typingConversationIds,
      unreadCount: conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0,
      ),
    }
  }

  const conversation = await prisma.chatConversation.findUnique({
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    where: { userId },
  })
  if (!conversation)
    return { latestAt: null, typingConversationIds, unreadCount: 0 }
  return {
    latestAt: conversation.messages[0]?.createdAt.toISOString() ?? null,
    typingConversationIds,
    unreadCount:
      (await countUnreadMessages({
        conversationId: conversation.id,
        readerId: userId,
      })) ?? 0,
  }
}

export function retrieveAttachmentForParticipant({
  attachmentId,
  requesterId,
}: {
  attachmentId: string
  requesterId: string
}) {
  return prisma.chatAttachment.findFirst({
    include: { message: { include: { conversation: true } } },
    where: {
      id: attachmentId,
      message: {
        conversation: {
          OR: [{ ownerId: requesterId }, { userId: requesterId }],
        },
      },
    },
  })
}
