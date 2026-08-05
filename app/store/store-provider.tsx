import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import type { TypedUseSelectorHook } from "react-redux"
import { Provider, useDispatch, useSelector } from "react-redux"

import type { AppDispatch, AppStore } from "./create-store"
import { createStore } from "./create-store"
import type { RootState } from "./root-reducer"
import {
  createClientWorkflowPorts,
  createServerWorkflowPorts,
} from "~/composition/generated/client-workflow-ports"

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

const createClientStore = () =>
  createStore({ ports: createClientWorkflowPorts(), shouldRunSagas: true })

const createServerStore = () =>
  createStore({ ports: createServerWorkflowPorts(), shouldRunSagas: false })

export function ClientWorkflowStoreProviderComponent({
  children,
  store: providedStore,
}: {
  children: ReactNode
  store?: AppStore
}) {
  const [{ isClientStore, store }, setProviderState] = useState<{
    isClientStore: boolean
    store: AppStore
  }>(() => ({
    isClientStore: Boolean(providedStore),
    store: providedStore ?? createServerStore(),
  }))

  useEffect(() => {
    if (!providedStore)
      setProviderState({ isClientStore: true, store: createClientStore() })
  }, [providedStore])

  return (
    <Provider key={isClientStore ? "client" : "server"} store={store}>
      {children}
    </Provider>
  )
}
