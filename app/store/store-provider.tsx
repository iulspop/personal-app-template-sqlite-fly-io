import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import type { TypedUseSelectorHook } from "react-redux"
import { Provider, useDispatch, useSelector } from "react-redux"

import {
  startChatWorkflow,
  stopChatWorkflow,
} from "../features/chat/application/chat-workflow/chat-workflow-actions"
import { createChatDraftsClient } from "../features/chat/infrastructure/chat-drafts-client"
import { createChatRealtimeClient } from "../features/chat/infrastructure/chat-realtime-client"
import type { AppDispatch, AppStore } from "./create-store"
import { createStore } from "./create-store"
import type { RootState } from "./root-reducer"

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

const createClientStore = () =>
  createStore({
    ports: {
      drafts: createChatDraftsClient(),
      realtime: createChatRealtimeClient(),
    },
    shouldRunSagas: true,
  })

const createServerStore = () =>
  createStore({
    ports: {
      drafts: {
        readDraft: () => "",
        removeDraft: () => undefined,
        writeDraft: () => undefined,
      },
      realtime: {
        isOnline: () => true,
        isVisible: () => true,
        observeOnline: () => () => undefined,
        observeVisibility: () => () => undefined,
        openConnection: () => ({ close: () => undefined }),
        publishPresence: async () => undefined,
        publishTyping: async () => undefined,
        wait: async () => undefined,
      },
    },
    shouldRunSagas: false,
  })

const ChatWorkflowLifecycleComponent = ({ viewerId }: { viewerId: string }) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(startChatWorkflow(viewerId))

    return () => {
      dispatch(stopChatWorkflow())
    }
  }, [dispatch, viewerId])

  return null
}

export function ChatStoreProviderComponent({
  children,
  store: providedStore,
  viewerId,
}: {
  children: ReactNode
  store?: AppStore
  viewerId: string
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
      <ChatWorkflowLifecycleComponent viewerId={viewerId} />
      {children}
    </Provider>
  )
}
