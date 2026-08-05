import { Form, Link } from "react-router"

import * as s from "./owner-onboarding-page.css"
import { Button } from "~/components/ui/button"
import { CHAT_CLAIM_OWNER_INTENT } from "~/features/chat/domain/chat-constants"

export function OwnerOnboardingPage({
  eligible,
  phoneConfigured,
}: {
  eligible: boolean
  phoneConfigured: boolean
}) {
  return (
    <main className={s.page}>
      <section className={s.card}>
        <h1 className={s.title}>Owner chat setup</h1>
        {eligible ? (
          <>
            <p className={s.body}>
              Claim the single owner seat to answer private user conversations.
              New unread message bursts can notify you by email
              {phoneConfigured ? " and SMS" : ""}.
            </p>
            <p className={s.body}>
              Message contents and attachments stay inside the authenticated
              chat dashboard.
            </p>
            <Form method="post">
              <Button
                name="intent"
                type="submit"
                value={CHAT_CLAIM_OWNER_INTENT}
              >
                Claim owner seat
              </Button>
            </Form>
          </>
        ) : (
          <p className={s.body}>Owner setup is unavailable for this account.</p>
        )}
        <Link className={s.backLink} to="/">
          Back to home
        </Link>
      </section>
    </main>
  )
}
