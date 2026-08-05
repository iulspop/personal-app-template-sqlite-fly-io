import { data, redirect } from "react-router"

import type { Route } from "./+types/owner.claim"
import { getServerEnv } from "~/config/server-env.server"
import { requireUserId } from "~/features/auth/application/auth-session.server"
import { OwnerOnboardingPage } from "~/features/chat/application/owner-onboarding-page"
import { CHAT_CLAIM_OWNER_INTENT } from "~/features/chat/domain/chat-constants"
import {
  isOwnerEmailAllowed,
  parseOwnerEmailAllowlist,
} from "~/features/chat/domain/chat-domain"
import {
  claimOwnerSeat,
  retrieveOwnerClaim,
} from "~/features/chat/infrastructure/chat-model.server"
import { isOwnerChatSmsConfigured } from "~/features/chat/infrastructure/chat-sms.server"
import { retrieveUserFromDatabaseById } from "~/features/users/infrastructure/users-model.server"

async function getClaimContext(request: Request) {
  const env = getServerEnv()
  const userId = await requireUserId(request)
  const [claim, user] = await Promise.all([
    retrieveOwnerClaim(),
    retrieveUserFromDatabaseById(userId),
  ])
  if (!user) throw redirect("/auth/signin")
  if (claim?.userId === userId) throw redirect("/owner/chats")
  return {
    claim,
    eligible:
      claim === null &&
      user.emailVerifiedAt !== null &&
      isOwnerEmailAllowed(
        user.email,
        parseOwnerEmailAllowlist(env.OWNER_EMAIL_ALLOWLIST),
      ),
    userId,
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const { eligible } = await getClaimContext(request)
  return {
    eligible,
    pageTitle: "Owner chat setup",
    phoneConfigured: isOwnerChatSmsConfigured(
      getServerEnv().OWNER_PHONE_NUMBER,
    ),
  }
}

export async function action({ request }: Route.ActionArgs) {
  const context = await getClaimContext(request)
  const formData = await request.formData()
  if (formData.get("intent") !== CHAT_CLAIM_OWNER_INTENT || !context.eligible)
    return data({ error: "Owner setup is unavailable." }, { status: 404 })

  try {
    await claimOwnerSeat(context.userId)
    throw redirect("/owner/chats")
  } catch (error) {
    if (error instanceof Response) throw error
    return data({ error: "Owner setup is unavailable." }, { status: 409 })
  }
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
]

export default function OwnerClaimRoute({ loaderData }: Route.ComponentProps) {
  return (
    <OwnerOnboardingPage
      eligible={loaderData.eligible}
      phoneConfigured={loaderData.phoneConfigured}
    />
  )
}
