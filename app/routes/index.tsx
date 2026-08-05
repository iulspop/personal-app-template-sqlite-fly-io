import { data } from "react-router"

import type { Route } from "./+types/index"
import { getServerEnv } from "~/config/server-env.server"
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
import { LandingPageComponent } from "~/features/todos/application/landing-page"
import { todosAction } from "~/features/todos/application/todos-action.server"
import { TodosPageComponent } from "~/features/todos/application/todos-page"
import {
  countByStatus,
  filterTodos,
  parseTodoFilter,
} from "~/features/todos/domain/todos-domain"
import { retrieveAllTodosFromDatabase } from "~/features/todos/infrastructure/todos-model.server"
import { retrieveUserFromDatabaseById } from "~/features/users/infrastructure/users-model.server"

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

export async function loader({ request }: Route.LoaderArgs) {
  const env = getServerEnv()
  const userId = await getUserId(request)
  if (!userId) return { isLanding: true as const, pageTitle: "Todo Demo" }

  const [allTodos, passkeys, user] = await Promise.all([
    retrieveAllTodosFromDatabase(),
    retrievePasskeysFromDatabaseByUserId(userId),
    retrieveUserFromDatabaseById(userId),
  ])
  const filter = parseTodoFilter(
    new URL(request.url).searchParams.get("filter"),
  )
  const existingVerification = user?.emailVerifiedAt
    ? null
    : await retrieveVerificationFromDatabaseByTypeAndTarget({
        target: user?.email ?? "",
        type: VERIFICATION_TYPE_EMAIL,
      })
  const [ownerClaim, ownerStatus] = await Promise.all([
    retrieveOwnerClaim(),
    retrieveOwnerStatusForUser(userId),
  ])
  let chatUnreadCount = 0
  if (ownerStatus) {
    const summaries = await retrieveOwnerConversationSummaries(userId)
    chatUnreadCount = summaries.reduce(
      (total, conversation) => total + conversation.unreadCount,
      0,
    )
  } else if (ownerClaim) {
    const conversation = await retrieveOrCreateConversation({
      ownerId: ownerClaim.userId,
      userId,
    })
    chatUnreadCount =
      (await countUnreadMessages({
        conversationId: conversation.id,
        readerId: userId,
      })) ?? 0
  }

  return {
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
    counts: countByStatus(allTodos),
    filter,
    hasPasskeys: passkeys.length > 0,
    isEmailVerified: Boolean(user?.emailVerifiedAt),
    isLanding: false as const,
    isOwner: Boolean(ownerStatus),
    pageTitle: "Todos",
    resendEmailVerificationCooldownSeconds: existingVerification
      ? calculateRemainingResendCooldownSeconds(existingVerification)
      : 0,
    todos: filterTodos(allTodos, filter),
    userEmail: user?.email ?? "",
  }
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
]

const hasRecentVerification = ({ expiresAt }: { expiresAt: Date }) =>
  calculateRemainingResendCooldownSeconds({ expiresAt }) > 0

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

  if (existingVerification && hasRecentVerification(existingVerification))
    return data(
      {
        cooldownSeconds:
          calculateRemainingResendCooldownSeconds(existingVerification),
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

export async function action(args: Route.ActionArgs) {
  const formData = await args.request.clone().formData()

  if (formData.get("intent") === RESEND_EMAIL_VERIFICATION_INTENT)
    return await resendEmailVerification({ request: args.request })

  return await todosAction(args)
}

export default function TodosRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  if (loaderData.isLanding) return <LandingPageComponent />

  return (
    <TodosPageComponent
      actionData={actionData}
      canClaimOwner={loaderData.canClaimOwner}
      chatUnreadCount={loaderData.chatUnreadCount}
      counts={loaderData.counts}
      filter={loaderData.filter}
      hasPasskeys={loaderData.hasPasskeys}
      isEmailVerified={loaderData.isEmailVerified}
      isOwner={loaderData.isOwner}
      resendEmailVerificationCooldownSeconds={
        loaderData.resendEmailVerificationCooldownSeconds
      }
      todos={loaderData.todos}
      userEmail={loaderData.userEmail}
    />
  )
}
