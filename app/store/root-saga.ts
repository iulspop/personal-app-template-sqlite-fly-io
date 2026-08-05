import type { SagaIterator } from "redux-saga"
import { all, fork } from "redux-saga/effects"

import type { FeatureWorkflowPorts } from "~/composition/generated/redux-sagas"
import { createFeatureSagas } from "~/composition/generated/redux-sagas"

export function* createRootSaga(ports: FeatureWorkflowPorts): SagaIterator {
  yield all([fork(createFeatureSagas, ports)])
}
