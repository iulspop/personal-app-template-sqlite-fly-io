import { IconChecklist, IconMessageCircle } from "@tabler/icons-react"

import type { AppNavigationItem } from "../composition-types"

export const primaryNavigationItems: AppNavigationItem[] = [
  // FEATURE_SLOT_BEGIN:primaryNavigation:todosNavigation
  {
    href: () => "/",
    icon: IconChecklist,
    label: () => "Todos",
  },
  // FEATURE_SLOT_END:primaryNavigation:todosNavigation
  // FEATURE_SLOT_BEGIN:primaryNavigation:founderChatNavigation
  {
    badge: ({ chatUnreadCount }) => chatUnreadCount,
    href: ({ isOwner }) => (isOwner ? "/owner/chats" : "/chat"),
    icon: IconMessageCircle,
    label: ({ isOwner }) => (isOwner ? "Chat dashboard" : "Chat with founder"),
  },
  // FEATURE_SLOT_END:primaryNavigation:founderChatNavigation
]
