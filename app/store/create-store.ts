import { applyMiddleware, legacy_createStore } from "redux"
import createSagaMiddleware from "redux-saga"

import { rootReducer } from "./root-reducer"
import { createRootSaga } from "./root-saga"
import type { FeatureWorkflowPorts } from "~/composition/generated/redux-sagas"

export const createStore = ({
  ports,
  shouldRunSagas = typeof window !== "undefined",
}: {
  ports: FeatureWorkflowPorts
  shouldRunSagas?: boolean
}) => {
  const sagaMiddleware = createSagaMiddleware()
  const store = legacy_createStore(rootReducer, applyMiddleware(sagaMiddleware))

  if (shouldRunSagas) sagaMiddleware.run(createRootSaga, ports)

  return store
}

export type AppStore = ReturnType<typeof createStore>
export type AppDispatch = AppStore["dispatch"]
