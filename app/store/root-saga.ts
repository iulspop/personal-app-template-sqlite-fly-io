import type { SagaIterator } from "redux-saga"
import { all, fork } from "redux-saga/effects"

import { createChatWorkflowSaga } from "../features/chat/application/chat-workflow/chat-workflow-sagas"
import type { ChatWorkflowPorts } from "../features/chat/domain/chat-workflow-ports"

export function* createRootSaga(ports: ChatWorkflowPorts): SagaIterator {
  yield all([fork(createChatWorkflowSaga, ports)])
}
