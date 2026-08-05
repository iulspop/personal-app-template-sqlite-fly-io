import {
  IconLogout,
  IconMenu2,
  IconSettings,
  IconSquareCheck,
} from "@tabler/icons-react"
import type { ReactNode } from "react"
import { Form, NavLink } from "react-router"

import * as s from "./app-shell.css"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { renderAppShellFeatureExtension } from "~/composition/generated/app-shell-extensions"
import { primaryNavigationItems } from "~/composition/generated/primary-navigation"
import { appConfig } from "~/config/app-config"
import { cx } from "~/utils/class-name"

type AppShellProps = {
  canClaimOwner?: boolean
  children: ReactNode
  chatUnreadCount?: number
  isOwner?: boolean
  userEmail: string
}

const navClassName = ({ isActive }: { isActive: boolean }) =>
  cx(s.navLink, isActive && s.navLinkActive)

function PrimaryNavigation({
  chatUnreadCount = 0,
  isOwner = false,
}: Pick<AppShellProps, "chatUnreadCount" | "isOwner">) {
  const context = { chatUnreadCount, isOwner }

  return (
    <nav aria-label="Primary navigation" className={s.navigation}>
      {primaryNavigationItems.map((item) => {
        const Icon = item.icon
        const badge = item.badge?.(context) ?? 0
        const href = item.href(context)

        return (
          <NavLink
            className={navClassName}
            end={href === "/"}
            key={href}
            to={href}
          >
            <Icon aria-hidden />
            <span>{item.label(context)}</span>
            {badge > 0 ? <Badge>{badge}</Badge> : null}
          </NavLink>
        )
      })}
    </nav>
  )
}

function AppShell({
  canClaimOwner = false,
  chatUnreadCount = 0,
  children,
  isOwner = false,
  userEmail,
}: AppShellProps) {
  const featureExtension = renderAppShellFeatureExtension({
    canClaimOwner,
    chatUnreadCount,
    isOwner,
  })

  return (
    <div className={s.shell}>
      <a className={s.skipLink} href="#main-content">
        Skip to content
      </a>
      <header className={s.header}>
        <NavLink
          aria-label={`${appConfig.shortName} home`}
          className={s.brand}
          to="/"
        >
          <IconSquareCheck aria-hidden="true" className={s.brandMark} />
          <span className={s.brandName}>{appConfig.shortName}</span>
        </NavLink>
        <div className={s.desktopNavigation}>
          <PrimaryNavigation
            chatUnreadCount={chatUnreadCount}
            isOwner={isOwner}
          />
        </div>
        <div className={s.account}>
          <span className={s.accountEmail} title={userEmail}>
            {userEmail}
          </span>
          <NavLink className={s.accountLink} to="/settings">
            <IconSettings aria-hidden="true" />
            <span>Settings</span>
          </NavLink>
          <Form action="/logout" method="post">
            <Button size="sm" type="submit" variant="ghost">
              <IconLogout aria-hidden="true" />
              Log out
            </Button>
          </Form>
        </div>
        <details className={s.mobileAccount}>
          <summary aria-label="Open navigation menu">
            <IconMenu2 aria-hidden="true" />
          </summary>
          <div className={s.mobileAccountMenu}>
            <span className={s.mobileAccountEmail} title={userEmail}>
              {userEmail}
            </span>
            <PrimaryNavigation
              chatUnreadCount={chatUnreadCount}
              isOwner={isOwner}
            />
            <div className={s.mobileMenuSeparator} />
            <NavLink className={s.accountLink} to="/settings">
              <IconSettings aria-hidden="true" />
              <span>Settings</span>
            </NavLink>
            <Form action="/logout" method="post">
              <Button size="sm" type="submit" variant="ghost">
                <IconLogout aria-hidden="true" />
                Log out
              </Button>
            </Form>
          </div>
        </details>
      </header>
      {featureExtension ? (
        <div className={s.ownerPrompt}>{featureExtension}</div>
      ) : null}
      <main className={s.main} id="main-content">
        {children}
      </main>
    </div>
  )
}

export { AppShell }
