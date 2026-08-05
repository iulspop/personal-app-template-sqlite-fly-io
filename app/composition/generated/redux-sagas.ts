import type { SagaIterator } from "redux-saga"
import { fork } from "redux-saga/effects"

// FEATURE_SLOT_BEGIN:reduxSagas:founderChatSagaImports
import { createChatWorkflowSaga } from "~/features/chat/application/chat-workflow/chat-workflow-sagas"
import type { ChatWorkflowPorts } from "~/features/chat/domain/chat-workflow-ports"
// FEATURE_SLOT_END:reduxSagas:founderChatSagaImports

export type FeatureWorkflowPorts = {
  // FEATURE_SLOT_BEGIN:reduxSagas:founderChatSagaPorts
  founderChat: ChatWorkflowPorts
  // FEATURE_SLOT_END:reduxSagas:founderChatSagaPorts
}

export function* createFeatureSagas(ports: FeatureWorkflowPorts): SagaIterator {
  // FEATURE_SLOT_BEGIN:reduxSagas:founderChatSaga
  yield fork(createChatWorkflowSaga, ports.founderChat)
  // FEATURE_SLOT_END:reduxSagas:founderChatSaga
}
