import type { Reducer, UnknownAction } from "redux"

// FEATURE_SLOT_BEGIN:reduxReducers:founderChatReducerImports
import type { ChatWorkflowState } from "~/features/chat/application/chat-workflow/chat-workflow-reducer"
import { chatWorkflowReducer } from "~/features/chat/application/chat-workflow/chat-workflow-reducer"
// FEATURE_SLOT_END:reduxReducers:founderChatReducerImports

export const featureReducers = {
  // FEATURE_SLOT_BEGIN:reduxReducers:founderChatReducer
  chatWorkflow: chatWorkflowReducer as Reducer<
    ChatWorkflowState,
    UnknownAction
  >,
  // FEATURE_SLOT_END:reduxReducers:founderChatReducer
}
