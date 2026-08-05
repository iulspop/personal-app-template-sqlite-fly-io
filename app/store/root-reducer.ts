import type { Reducer, UnknownAction } from "redux"
import { combineReducers } from "redux"

import type { ChatWorkflowState } from "../features/chat/application/chat-workflow/chat-workflow-reducer"
import { chatWorkflowReducer } from "../features/chat/application/chat-workflow/chat-workflow-reducer"

export const rootReducer = combineReducers({
  chatWorkflow: chatWorkflowReducer as Reducer<
    ChatWorkflowState,
    UnknownAction
  >,
})

export type RootState = ReturnType<typeof rootReducer>
