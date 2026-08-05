import { applyMiddleware, legacy_createStore } from "redux"
import createSagaMiddleware from "redux-saga"

import type { ChatWorkflowPorts } from "../features/chat/domain/chat-workflow-ports"
import { rootReducer } from "./root-reducer"
import { createRootSaga } from "./root-saga"

export const createStore = ({
  ports,
  shouldRunSagas = typeof window !== "undefined",
}: {
  ports: ChatWorkflowPorts
  shouldRunSagas?: boolean
}) => {
  const sagaMiddleware = createSagaMiddleware()
  const store = legacy_createStore(rootReducer, applyMiddleware(sagaMiddleware))

  if (shouldRunSagas) sagaMiddleware.run(createRootSaga, ports)

  return store
}

export type AppStore = ReturnType<typeof createStore>
export type AppDispatch = AppStore["dispatch"]
