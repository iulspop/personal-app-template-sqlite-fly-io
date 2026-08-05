import { createChatDraftKey } from "../domain/chat-workflow-domain"
import type {
  ChatDraftsPort,
  ChatWorkflowIdentity,
} from "../domain/chat-workflow-ports"

type DraftStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">

const getDraftKey = ({ conversationId, viewerId }: ChatWorkflowIdentity) =>
  createChatDraftKey({ conversationId, viewerId })

export const createChatDraftsClient = ({
  storage = globalThis.localStorage,
}: {
  storage?: DraftStorage
} = {}): ChatDraftsPort => ({
  readDraft: (identity) => {
    try {
      return storage.getItem(getDraftKey(identity)) ?? ""
    } catch {
      return ""
    }
  },
  removeDraft: (identity) => {
    try {
      storage.removeItem(getDraftKey(identity))
    } catch {
      return
    }
  },
  writeDraft: ({ draft, ...identity }) => {
    try {
      storage.setItem(getDraftKey(identity), draft)
    } catch {
      return
    }
  },
})
