import type { ReactNode } from "react"
import { Fragment, useEffect } from "react"

import type { AuthenticatedProviderComponentProps } from "../composition-types"
// FEATURE_SLOT_BEGIN:authenticatedProviders:founderChatProviderImports
import { ChatNotificationProvider } from "~/features/chat/application/chat-notification-provider"
import {
  startChatWorkflow,
  stopChatWorkflow,
} from "~/features/chat/application/chat-workflow/chat-workflow-actions"
import {
  ClientWorkflowStoreProviderComponent,
  useAppDispatch,
} from "~/store/store-provider"

// FEATURE_SLOT_END:authenticatedProviders:founderChatProviderImports

// FEATURE_SLOT_BEGIN:authenticatedProviders:founderChatProviderLifecycle
const FounderChatWorkflowLifecycleComponent = ({
  viewerId,
}: {
  viewerId: string
}) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(startChatWorkflow(viewerId))
    return () => {
      dispatch(stopChatWorkflow())
    }
  }, [dispatch, viewerId])

  return null
}
// FEATURE_SLOT_END:authenticatedProviders:founderChatProviderLifecycle

export function AuthenticatedFeatureProvidersComponent({
  children,
  viewerId,
}: AuthenticatedProviderComponentProps) {
  let content: ReactNode = <Fragment>{children}</Fragment>

  // FEATURE_SLOT_BEGIN:authenticatedProviders:founderChatProviders
  content = (
    <ClientWorkflowStoreProviderComponent>
      <FounderChatWorkflowLifecycleComponent viewerId={viewerId} />
      <ChatNotificationProvider>{content}</ChatNotificationProvider>
    </ClientWorkflowStoreProviderComponent>
  )
  // FEATURE_SLOT_END:authenticatedProviders:founderChatProviders

  return content
}
