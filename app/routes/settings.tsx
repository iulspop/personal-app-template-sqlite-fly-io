import { data, redirect } from "react-router"

import type { Route } from "./+types/settings"
import { AppShell } from "~/components/app-shell/app-shell"
import { getServerEnv } from "~/config/server-env.server"
import { requireUserId } from "~/features/auth/application/auth-session.server"
import { SettingsPageComponent } from "~/features/auth/application/settings-page"
import {
  deletePasskeyFromDatabaseByIdAndUserId,
  retrievePasskeysFromDatabaseByUserId,
} from "~/features/auth/infrastructure/passkeys-model.server"
import { retrieveOwnerStatusForUser } from "~/features/chat/infrastructure/chat-model.server"
import { isOwnerChatSmsConfigured } from "~/features/chat/infrastructure/chat-sms.server"
import { retrieveUserFromDatabaseById } from "~/features/users/infrastructure/users-model.server"

export async function loader({ request }: Route.LoaderArgs) {
  const env = getServerEnv()
  const userId = await requireUserId(request)
  const [ownerStatus, passkeys, user] = await Promise.all([
    retrieveOwnerStatusForUser(userId),
    retrievePasskeysFromDatabaseByUserId(userId),
    retrieveUserFromDatabaseById(userId),
  ])

  if (!user) throw redirect("/auth/signin")

  return {
    chatEmailConfigured: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
    chatSmsConfigured: isOwnerChatSmsConfigured(env.OWNER_PHONE_NUMBER),
    isOwner: Boolean(ownerStatus),
    pageTitle: "Settings",
    passkeys: passkeys.map((passkey) => ({
      createdAt: passkey.createdAt.toISOString(),
      id: passkey.id,
    })),
    userEmail: user.email,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()

  if (formData.get("intent") !== "deletePasskey") {
    return data(
      { error: "Invalid form data", success: false as const },
      { status: 400 },
    )
  }

  const passkeyId = formData.get("passkeyId")
  if (typeof passkeyId !== "string" || passkeyId.length === 0) {
    return data(
      { error: "Invalid form data", success: false as const },
      { status: 400 },
    )
  }

  await deletePasskeyFromDatabaseByIdAndUserId({ id: passkeyId, userId })

  return data({ error: null, success: true as const })
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
]

export default function SettingsRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  return (
    <AppShell isOwner={loaderData.isOwner} userEmail={loaderData.userEmail}>
      <SettingsPageComponent
        actionData={actionData}
        chatEmailConfigured={loaderData.chatEmailConfigured}
        chatSmsConfigured={loaderData.chatSmsConfigured}
        isOwner={loaderData.isOwner}
        passkeys={loaderData.passkeys}
        userEmail={loaderData.userEmail}
      />
    </AppShell>
  )
}
