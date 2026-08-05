import { combineReducers } from "redux"

import { featureReducers } from "~/composition/generated/redux-reducers"

export const rootReducer = combineReducers(featureReducers)

export type RootState = ReturnType<typeof rootReducer>
