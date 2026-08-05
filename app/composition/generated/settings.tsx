// biome-ignore-all assist/source/organizeImports: Generated feature slots require stable import boundaries.
// FEATURE_SLOT_BEGIN:settingsLinks:founderChatSettingsUiImports
import { IconBell, IconMessageCircle } from "@tabler/icons-react"
import { Link } from "react-router"
import * as s from "~/features/auth/application/settings-page.css"
// FEATURE_SLOT_END:settingsLinks:founderChatSettingsUiImports
import type { SettingsFeatureData } from "./settings.server"

export const settingsLinks = [
  // FEATURE_SLOT_BEGIN:settingsLinks:founderChatSettingsLink
  { href: "#chat", label: "Founder chat" },
  // FEATURE_SLOT_END:settingsLinks:founderChatSettingsLink
]

export function SettingsFeatureSectionsComponent(
  featureData: SettingsFeatureData,
) {
  let sections: React.ReactNode = null
  // FEATURE_SLOT_BEGIN:settingsLinks:founderChatSettings
  const { chatEmailConfigured, chatSmsConfigured, isOwner } = featureData
  sections = (
    <section className={s.section} id="chat">
      <div className={s.sectionHeading}>
        <h2>Founder chat</h2>
        <p>Role and notification delivery for private conversations.</p>
      </div>
      <div className={s.settingRow}>
        <IconMessageCircle aria-hidden="true" className={s.rowIcon} size={17} />
        <div className={s.settingCopy}>
          <span className={s.settingTitle}>Chat role</span>
          <span className={s.settingDescription}>
            Status: {isOwner ? "Owner" : "Regular user"}
          </span>
        </div>
        {isOwner ? (
          <Link className={s.rowLink} to="/owner/chats">
            Open chat dashboard
          </Link>
        ) : null}
      </div>
      {isOwner ? (
        <div className={s.notificationRows}>
          <div className={s.settingRow}>
            <IconBell aria-hidden="true" className={s.rowIcon} size={17} />
            <span className={s.settingTitle}>
              Email notifications:{" "}
              {chatEmailConfigured ? "Configured" : "Not configured"}
            </span>
            <span className={s.badge}>
              {chatEmailConfigured ? "On" : "Off"}
            </span>
          </div>
          <div className={s.settingRow}>
            <span aria-hidden="true" className={s.rowIconPlaceholder} />
            <span className={s.settingTitle}>
              SMS notifications:{" "}
              {chatSmsConfigured ? "Configured" : "Not configured"}
            </span>
            <span className={s.badge}>{chatSmsConfigured ? "On" : "Off"}</span>
          </div>
        </div>
      ) : null}
    </section>
  )
  // FEATURE_SLOT_END:settingsLinks:founderChatSettings
  return sections
}
