// biome-ignore-all assist/source/organizeImports: Generated feature slots require stable import boundaries.
import type { ReactNode } from "react"
import { Link } from "react-router"
import { AppShell } from "~/components/app-shell/app-shell"
// FEATURE_SLOT_BEGIN:homeContent:todosHomeComponentImports
import { LandingPageComponent } from "~/features/todos/application/landing-page"
import { TodosPageComponent } from "~/features/todos/application/todos-page"
// FEATURE_SLOT_END:homeContent:todosHomeComponentImports
import type { HomeData } from "./home-content.server"

export default function HomeContentComponent({
  actionData,
  loaderData,
}: {
  actionData?: unknown
  loaderData: HomeData
}) {
  let content: ReactNode = loaderData.isLanding ? (
    <main>
      <h1>Welcome</h1>
      <p>Sign in to open your personal workspace.</p>
      <Link to="/login">Sign in</Link>
    </main>
  ) : (
    <AppShell
      canClaimOwner={loaderData.canClaimOwner}
      chatUnreadCount={loaderData.chatUnreadCount}
      isOwner={loaderData.isOwner}
      userEmail={loaderData.userEmail}
    >
      <main>
        <h1>Your workspace</h1>
        <p>Use Settings to finish configuring your app.</p>
      </main>
    </AppShell>
  )

  // FEATURE_SLOT_BEGIN:homeContent:todosHomeComponent
  content = loaderData.isLanding ? (
    <LandingPageComponent />
  ) : (
    <TodosPageComponent
      actionData={
        actionData as Parameters<typeof TodosPageComponent>[0]["actionData"]
      }
      canClaimOwner={loaderData.canClaimOwner}
      chatUnreadCount={loaderData.chatUnreadCount}
      counts={
        loaderData.counts as Parameters<typeof TodosPageComponent>[0]["counts"]
      }
      filter={
        loaderData.filter as Parameters<typeof TodosPageComponent>[0]["filter"]
      }
      hasPasskeys={loaderData.hasPasskeys}
      isEmailVerified={loaderData.isEmailVerified}
      isOwner={loaderData.isOwner}
      resendEmailVerificationCooldownSeconds={
        loaderData.resendEmailVerificationCooldownSeconds
      }
      todos={
        loaderData.todos as Parameters<typeof TodosPageComponent>[0]["todos"]
      }
      userEmail={loaderData.userEmail}
    />
  )
  // FEATURE_SLOT_END:homeContent:todosHomeComponent

  return content
}
