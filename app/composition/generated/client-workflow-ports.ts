import type { FeatureWorkflowPorts } from "./redux-sagas"
// FEATURE_SLOT_BEGIN:reduxSagas:founderChatClientPortImports
import { createChatDraftsClient } from "~/features/chat/infrastructure/chat-drafts-client"
import { createChatRealtimeClient } from "~/features/chat/infrastructure/chat-realtime-client"
// FEATURE_SLOT_END:reduxSagas:founderChatClientPortImports

export const createClientWorkflowPorts = (): FeatureWorkflowPorts => ({
  // FEATURE_SLOT_BEGIN:reduxSagas:founderChatClientPorts
  founderChat: {
    drafts: createChatDraftsClient(),
    realtime: createChatRealtimeClient(),
  },
  // FEATURE_SLOT_END:reduxSagas:founderChatClientPorts
})

export const createServerWorkflowPorts = (): FeatureWorkflowPorts => ({
  // FEATURE_SLOT_BEGIN:reduxSagas:founderChatServerPorts
  founderChat: {
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
  // FEATURE_SLOT_END:reduxSagas:founderChatServerPorts
})
