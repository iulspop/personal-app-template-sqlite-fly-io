import { createChatDraftKey } from "../../domain/chat-workflow-domain"
import type { ChatWorkflowIdentity } from "../../domain/chat-workflow-ports"
import type { ChatWorkflowState } from "./chat-workflow-reducer"

export type ChatWorkflowRootState = { chatWorkflow: ChatWorkflowState }

export const selectChatConnectionStatus = ({
  chatWorkflow,
}: ChatWorkflowRootState) => chatWorkflow.connection.status
export const selectChatUnreadCount = ({
  chatWorkflow,
}: ChatWorkflowRootState) => chatWorkflow.snapshot.unreadCount
export const selectChatTypingConversationIds = ({
  chatWorkflow,
}: ChatWorkflowRootState) => chatWorkflow.snapshot.typingConversationIds
export const selectChatSnapshotSequence = ({
  chatWorkflow,
}: ChatWorkflowRootState) => chatWorkflow.snapshot.sequence
export const selectIsChatNotificationVisible = ({
  chatWorkflow,
}: ChatWorkflowRootState) =>
  chatWorkflow.snapshot.unreadCount > 0 && !chatWorkflow.notificationDismissed
export const selectChatDraft = (
  { chatWorkflow }: ChatWorkflowRootState,
  identity: ChatWorkflowIdentity,
) => chatWorkflow.drafts[createChatDraftKey(identity)] ?? ""
