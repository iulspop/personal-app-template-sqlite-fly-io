import type { ComponentType, ReactNode } from "react"

export type AppNavigationContext = {
  chatUnreadCount: number
  isOwner: boolean
}

export type AppNavigationItem = {
  badge?: (context: AppNavigationContext) => number
  href: (context: AppNavigationContext) => string
  icon: ComponentType<{ "aria-hidden"?: boolean }>
  label: (context: AppNavigationContext) => string
}

export type AuthenticatedProviderComponentProps = {
  children: ReactNode
  viewerId: string
}

export type AppShellExtensionContext = AppNavigationContext & {
  canClaimOwner: boolean
}
