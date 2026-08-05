// biome-ignore-all assist/source/organizeImports: Generated feature slots require stable import boundaries.
import type { ActionFunctionArgs } from "react-router"
import { data } from "react-router"

import {
  getUserId,
  requireUserId,
} from "~/features/auth/application/auth-session.server"
import {
  RESEND_EMAIL_VERIFICATION_INTENT,
  VERIFICATION_EXPIRY_MINUTES,
  VERIFICATION_RESEND_COOLDOWN_MINUTES,
  VERIFICATION_TYPE_EMAIL,
} from "~/features/auth/domain/auth-constants"
import {
  buildMagicLinkUrl,
  computeVerificationExpiry,
} from "~/features/auth/domain/auth-domain"
import { sendVerificationEmail } from "~/features/auth/infrastructure/email.server"
import { retrievePasskeysFromDatabaseByUserId } from "~/features/auth/infrastructure/passkeys-model.server"
import { generateVerificationTOTP } from "~/features/auth/infrastructure/totp.server"
import {
  retrieveVerificationFromDatabaseByTypeAndTarget,
  saveVerificationToDatabase,
} from "~/features/auth/infrastructure/verifications-model.server"
// FEATURE_SLOT_BEGIN:homeContent:founderChatHomeImports
import { getServerEnv } from "~/config/server-env.server"
import {
  isOwnerEmailAllowed,
  parseOwnerEmailAllowlist,
} from "~/features/chat/domain/chat-domain"
import {
  countUnreadMessages,
  retrieveOrCreateConversation,
  retrieveOwnerClaim,
  retrieveOwnerConversationSummaries,
  retrieveOwnerStatusForUser,
} from "~/features/chat/infrastructure/chat-model.server"
// FEATURE_SLOT_END:homeContent:founderChatHomeImports
// FEATURE_SLOT_BEGIN:homeContent:todosHomeImports
import { todosAction } from "~/features/todos/application/todos-action.server"
import {
  countByStatus,
  filterTodos,
  parseTodoFilter,
} from "~/features/todos/domain/todos-domain"
import { retrieveAllTodosFromDatabase } from "~/features/todos/infrastructure/todos-model.server"
// FEATURE_SLOT_END:homeContent:todosHomeImports
import { retrieveUserFromDatabaseById } from "~/features/users/infrastructure/users-model.server"

export type HomeData = Record<string, unknown> & {
  canClaimOwner: boolean
  chatUnreadCount: number
  hasPasskeys: boolean
  isEmailVerified: boolean
  isLanding: boolean
  isOwner: boolean
  pageTitle: string
  resendEmailVerificationCooldownSeconds: number
  userEmail: string
}

const calculateRemainingResendCooldownSeconds = ({
  expiresAt,
  now = new Date(),
}: {
  expiresAt: Date
  now?: Date
}) => {
  const sentAt = new Date(
    expiresAt.getTime() - VERIFICATION_EXPIRY_MINUTES * 60 * 1000,
  )
  return Math.max(
    0,
    Math.ceil(
      (VERIFICATION_RESEND_COOLDOWN_MINUTES * 60 * 1000 -
        (now.getTime() - sentAt.getTime())) /
        1000,
    ),
  )
}

export async function loader({ request }: { request: Request }) {
  const userId = await getUserId(request)
  if (!userId) {
    let pageTitle = "Welcome"
    // FEATURE_SLOT_BEGIN:homeContent:todosLandingData
    pageTitle = "Todo Demo"
    // FEATURE_SLOT_END:homeContent:todosLandingData
    return {
      canClaimOwner: false,
      chatUnreadCount: 0,
      hasPasskeys: false,
      isEmailVerified: false,
      isLanding: true,
      isOwner: false,
      pageTitle,
      resendEmailVerificationCooldownSeconds: 0,
      userEmail: "",
    } satisfies HomeData
  }

  const [passkeys, user] = await Promise.all([
    retrievePasskeysFromDatabaseByUserId(userId),
    retrieveUserFromDatabaseById(userId),
  ])
  const existingVerification = user?.emailVerifiedAt
    ? null
    : await retrieveVerificationFromDatabaseByTypeAndTarget({
        target: user?.email ?? "",
        type: VERIFICATION_TYPE_EMAIL,
      })
  const homeData: HomeData = {
    canClaimOwner: false,
    chatUnreadCount: 0,
    hasPasskeys: passkeys.length > 0,
    isEmailVerified: Boolean(user?.emailVerifiedAt),
    isLanding: false,
    isOwner: false,
    pageTitle: "Home",
    resendEmailVerificationCooldownSeconds: existingVerification
      ? calculateRemainingResendCooldownSeconds(existingVerification)
      : 0,
    userEmail: user?.email ?? "",
  }

  // FEATURE_SLOT_BEGIN:homeContent:todosHome
  const allTodos = await retrieveAllTodosFromDatabase()
  const filter = parseTodoFilter(
    new URL(request.url).searchParams.get("filter"),
  )
  Object.assign(homeData, {
    counts: countByStatus(allTodos),
    filter,
    pageTitle: "Todos",
    todos: filterTodos(allTodos, filter),
  })
  // FEATURE_SLOT_END:homeContent:todosHome

  // FEATURE_SLOT_BEGIN:homeContent:founderChatHome
  const env = getServerEnv()
  const [ownerClaim, ownerStatus] = await Promise.all([
    retrieveOwnerClaim(),
    retrieveOwnerStatusForUser(userId),
  ])
  const chatUnreadCount = ownerStatus
    ? (await retrieveOwnerConversationSummaries(userId)).reduce(
        (total, conversation) => total + conversation.unreadCount,
        0,
      )
    : ownerClaim
      ? ((await countUnreadMessages({
          conversationId: (
            await retrieveOrCreateConversation({
              ownerId: ownerClaim.userId,
              userId,
            })
          ).id,
          readerId: userId,
        })) ?? 0)
      : 0
  Object.assign(homeData, {
    canClaimOwner:
      !ownerClaim &&
      Boolean(user?.emailVerifiedAt) &&
      Boolean(
        user &&
          isOwnerEmailAllowed(
            user.email,
            parseOwnerEmailAllowlist(env.OWNER_EMAIL_ALLOWLIST),
          ),
      ),
    chatUnreadCount,
    isOwner: Boolean(ownerStatus),
  })
  // FEATURE_SLOT_END:homeContent:founderChatHome

  return homeData
}

const resendEmailVerification = async ({ request }: { request: Request }) => {
  const userId = await requireUserId(request)
  const user = await retrieveUserFromDatabaseById(userId)
  if (!user || user.emailVerifiedAt)
    return data({ error: null, success: true as const })

  const existingVerification =
    await retrieveVerificationFromDatabaseByTypeAndTarget({
      target: user.email,
      type: VERIFICATION_TYPE_EMAIL,
    })
  const cooldownSeconds = existingVerification
    ? calculateRemainingResendCooldownSeconds(existingVerification)
    : 0
  if (cooldownSeconds > 0)
    return data(
      {
        cooldownSeconds,
        error: "Please wait before requesting another verification email.",
        intent: RESEND_EMAIL_VERIFICATION_INTENT,
        success: false as const,
      },
      { status: 429 },
    )

  const { algorithm, charSet, digits, otp, period, secret } =
    await generateVerificationTOTP()
  await saveVerificationToDatabase({
    algorithm,
    charSet,
    digits,
    expiresAt: computeVerificationExpiry(VERIFICATION_EXPIRY_MINUTES),
    period,
    secret,
    target: user.email,
    type: VERIFICATION_TYPE_EMAIL,
  })
  await sendVerificationEmail({
    code: otp,
    email: user.email,
    verificationUrl: buildMagicLinkUrl({
      baseUrl: new URL(request.url).origin,
      code: otp,
      target: user.email,
      type: VERIFICATION_TYPE_EMAIL,
    }),
  })
  return data({
    cooldownSeconds: VERIFICATION_RESEND_COOLDOWN_MINUTES * 60,
    error: null,
    intent: RESEND_EMAIL_VERIFICATION_INTENT,
    success: true as const,
  })
}

export async function action(args: ActionFunctionArgs) {
  const formData = await args.request.clone().formData()
  if (formData.get("intent") === RESEND_EMAIL_VERIFICATION_INTENT)
    return await resendEmailVerification({ request: args.request })

  // FEATURE_SLOT_BEGIN:homeContent:todosHomeAction
  if (formData.get("intent")) return await todosAction(args)
  // FEATURE_SLOT_END:homeContent:todosHomeAction

  return data(
    { error: "Unsupported home action", success: false as const },
    { status: 400 },
  )
}
