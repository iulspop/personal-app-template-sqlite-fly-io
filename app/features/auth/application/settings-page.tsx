import { startRegistration } from "@simplewebauthn/browser"
import { IconKey, IconUser } from "@tabler/icons-react"
import { useState } from "react"
import { Form, Link } from "react-router"

import { AppearanceControl } from "./appearance-control"
import * as s from "./settings-page.css"
import { Button } from "~/components/ui/button"
import { FieldError } from "~/components/ui/field"
import {
  SettingsFeatureSectionsComponent,
  settingsLinks,
} from "~/composition/generated/settings"
import { cx } from "~/utils/class-name"

type SettingsActionData =
  | { error: null; success: true }
  | { error: string; success: false }
  | undefined

type PasskeySummary = { createdAt: string; id: string }

export function SettingsPageComponent({
  actionData,
  chatEmailConfigured = false,
  chatSmsConfigured = false,
  isOwner = false,
  passkeys,
  userEmail,
}: {
  actionData?: SettingsActionData
  chatEmailConfigured?: boolean
  chatSmsConfigured?: boolean
  isOwner?: boolean
  passkeys: PasskeySummary[]
  userEmail: string
}) {
  const [passkeySetupState, setPasskeySetupState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")
  const hasActivePasskey = passkeys.length > 0 || passkeySetupState === "saved"

  const setupPasskey = async () => {
    setPasskeySetupState("saving")
    try {
      const optionsResponse = await fetch("/auth/passkey/register")
      const optionsJSON = await optionsResponse.json()
      if (!optionsResponse.ok) {
        setPasskeySetupState("error")
        return
      }
      const credential = await startRegistration({ optionsJSON })
      const result = await fetch("/auth/passkey/register", {
        body: JSON.stringify(credential),
        headers: { "Content-Type": "application/json" },
        method: "post",
      }).then((res) => res.json())
      setPasskeySetupState(result.verified ? "saved" : "error")
    } catch {
      setPasskeySetupState("error")
    }
  }

  return (
    <section className={s.page}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Settings</h1>
          <p className={s.subtitle}>
            Manage your account and workspace preferences.
          </p>
        </div>
        <Link className={s.backLink} to="/">
          Back to workspace
        </Link>
      </header>

      <div className={s.layout}>
        <nav aria-label="Settings sections" className={s.sectionNav}>
          <a href="#appearance">Appearance</a>
          <a href="#account">Account</a>
          <a href="#passkeys">Passkeys</a>
          {settingsLinks.map(({ href, label }) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className={s.sections}>
          <section className={s.section} id="appearance">
            <div className={s.sectionHeading}>
              <h2>Appearance</h2>
              <p>Choose how Todo looks on this device.</p>
            </div>
            <div className={s.settingRow}>
              <div className={s.settingCopy}>
                <span className={s.settingTitle}>Theme</span>
                <span className={s.settingDescription}>
                  Light mode is the default. Your preference is saved on this
                  device.
                </span>
              </div>
              <AppearanceControl />
            </div>
          </section>

          <section className={s.section} id="account">
            <div className={s.sectionHeading}>
              <h2>Account</h2>
              <p>Your current identity and access level.</p>
            </div>
            <div className={s.settingRow}>
              <IconUser aria-hidden="true" className={s.rowIcon} size={17} />
              <div className={s.settingCopy}>
                <span className={s.settingTitle}>{userEmail}</span>
                <span className={s.settingDescription}>Signed-in email</span>
              </div>
              <span className={s.badge}>{isOwner ? "Owner" : "Member"}</span>
            </div>
          </section>

          <section className={s.section} id="passkeys">
            <div className={s.sectionHeading}>
              <h2>Passkeys</h2>
              <p>
                Use your device unlock instead of waiting for an email link.
              </p>
            </div>
            <div className={s.settingRow}>
              <IconKey aria-hidden="true" className={s.rowIcon} size={17} />
              <div className={s.settingCopy}>
                <span className={s.settingTitle}>Sign-in method</span>
                <span className={s.settingDescription}>
                  Status:{" "}
                  {hasActivePasskey ? "Passkey enabled" : "Email sign-in only"}
                </span>
              </div>
              <Button
                disabled={passkeySetupState === "saving"}
                onClick={setupPasskey}
                size="sm"
                type="button"
                variant={hasActivePasskey ? "outline" : "default"}
              >
                {passkeySetupState === "saving"
                  ? "Adding passkey…"
                  : "Add passkey"}
              </Button>
            </div>
            {passkeys.length > 0 && (
              <ul className={s.passkeyList}>
                {passkeys.map((passkey) => (
                  <li className={s.passkeyItem} key={passkey.id}>
                    <span>
                      Passkey added{" "}
                      {new Date(passkey.createdAt).toLocaleDateString()}
                    </span>
                    <Form method="post">
                      <input
                        name="passkeyId"
                        type="hidden"
                        value={passkey.id}
                      />
                      <Button
                        name="intent"
                        size="xs"
                        type="submit"
                        value="deletePasskey"
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    </Form>
                  </li>
                ))}
              </ul>
            )}
            {passkeySetupState === "saved" && (
              <p className={cx(s.status, s.success)}>Passkey added.</p>
            )}
            {passkeySetupState === "error" && (
              <FieldError className={s.status}>
                Passkey setup failed.
              </FieldError>
            )}
            {actionData?.success === false && (
              <FieldError className={s.status}>{actionData.error}</FieldError>
            )}
          </section>

          <SettingsFeatureSectionsComponent
            chatEmailConfigured={chatEmailConfigured}
            chatSmsConfigured={chatSmsConfigured}
            isOwner={isOwner}
          />
        </div>
      </div>
    </section>
  )
}
