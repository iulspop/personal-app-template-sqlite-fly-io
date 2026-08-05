import type { EventChannel, SagaIterator } from "redux-saga"
import { eventChannel } from "redux-saga"
import {
  call,
  cancelled,
  debounce,
  delay,
  fork,
  put,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects"

import {
  CHAT_PRESENCE_HEARTBEAT_MS,
  CHAT_TYPING_IDLE_TIMEOUT_MS,
} from "../../domain/chat-constants"
import { calculateChatReconnectDelay } from "../../domain/chat-workflow-domain"
import type {
  ChatDraftsPort,
  ChatRealtimePort,
  ChatWorkflowIdentity,
  ChatWorkflowPorts,
} from "../../domain/chat-workflow-ports"
import type {
  changeChatDraft,
  clearChatDraft,
  openChatThread,
  publishChatTyping,
  startChatWorkflow,
  stopChatTyping,
} from "./chat-workflow-actions"
import {
  CHAT_DRAFT_CHANGED,
  CHAT_DRAFT_CLEARED,
  CHAT_THREAD_OPENED,
  CHAT_TYPING_ACTIVITY,
  CHAT_TYPING_STOPPED,
  CHAT_WORKFLOW_STARTED,
  CHAT_WORKFLOW_STOPPED,
  changeChatConnection,
  receiveChatSnapshot,
  restoreChatDraft,
} from "./chat-workflow-actions"

type RealtimeEvent =
  | { type: "error" }
  | { type: "open" }
  | {
      snapshot: Parameters<typeof receiveChatSnapshot>[0]
      type: "snapshot"
    }

const createOnlineChannel = (
  realtime: ChatRealtimePort,
): EventChannel<boolean> => eventChannel((emit) => realtime.observeOnline(emit))

const createRealtimeChannel = (
  realtime: ChatRealtimePort,
): EventChannel<RealtimeEvent> =>
  eventChannel((emit) => {
    const connection = realtime.openConnection({
      onError: () => emit({ type: "error" }),
      onOpen: () => emit({ type: "open" }),
      onSnapshot: (snapshot) => emit({ snapshot, type: "snapshot" }),
    })

    return connection.close
  })

export function* restoreChatThreadDraft(
  { readDraft }: Pick<ChatDraftsPort, "readDraft">,
  identity: ChatWorkflowIdentity,
): SagaIterator {
  const draft: string = yield call(readDraft, identity)
  yield put(restoreChatDraft({ ...identity, draft }))
}

function* persistChatDraft(
  { writeDraft }: Pick<ChatDraftsPort, "writeDraft">,
  { payload }: ReturnType<typeof changeChatDraft>,
): SagaIterator {
  yield call(writeDraft, payload)
}

function* removeChatDraft(
  { removeDraft }: Pick<ChatDraftsPort, "removeDraft">,
  { payload }: ReturnType<typeof clearChatDraft>,
): SagaIterator {
  yield call(removeDraft, payload)
}

export function* reconnectChat(
  { wait }: Pick<ChatRealtimePort, "wait">,
  attempt: number,
): SagaIterator {
  yield put(changeChatConnection({ attempt, status: "reconnecting" }))
  yield call(wait, calculateChatReconnectDelay({ attempt }))
}

function* runRealtimeConnection(realtime: ChatRealtimePort): SagaIterator {
  let attempt = 0

  while (true) {
    yield put(
      changeChatConnection({
        attempt,
        status: attempt === 0 ? "connecting" : "reconnecting",
      }),
    )

    const channel: EventChannel<RealtimeEvent> = yield call(
      createRealtimeChannel,
      realtime,
    )
    let shouldReconnect = false

    try {
      while (!shouldReconnect) {
        const event: RealtimeEvent = yield take(channel)

        if (event.type === "open") {
          attempt = 0
          yield put(changeChatConnection({ status: "connected" }))
        }
        if (event.type === "snapshot")
          yield put(receiveChatSnapshot(event.snapshot))
        if (event.type === "error") shouldReconnect = true
      }
    } finally {
      channel.close()
    }

    attempt += 1
    yield* reconnectChat(realtime, attempt)
  }
}

export function* updateChatOnlineStatus(isOnline: boolean): SagaIterator {
  yield put(
    changeChatConnection({ status: isOnline ? "connecting" : "offline" }),
  )
}

function* watchChatOnlineStatus(realtime: ChatRealtimePort): SagaIterator {
  const channel: EventChannel<boolean> = yield call(
    createOnlineChannel,
    realtime,
  )

  try {
    while (true) {
      const isOnline: boolean = yield take(channel)
      yield* updateChatOnlineStatus(isOnline)
    }
  } finally {
    channel.close()
  }
}

function* runPresenceHeartbeat(realtime: ChatRealtimePort): SagaIterator {
  while (true) {
    if (realtime.isOnline() && realtime.isVisible()) {
      try {
        yield call(realtime.publishPresence)
      } catch {
        // The realtime connection state communicates transient failures.
      }
    }
    yield delay(CHAT_PRESENCE_HEARTBEAT_MS)
  }
}

function* publishTypingActivity(
  realtime: ChatRealtimePort,
  { payload }: ReturnType<typeof publishChatTyping>,
): SagaIterator {
  try {
    yield call(realtime.publishTyping, { ...payload, isTyping: true })
    yield delay(CHAT_TYPING_IDLE_TIMEOUT_MS)
    yield call(realtime.publishTyping, { ...payload, isTyping: false })
  } finally {
    if (yield cancelled()) {
      yield call(realtime.publishTyping, { ...payload, isTyping: false })
    }
  }
}

function* publishTypingStop(
  realtime: ChatRealtimePort,
  { payload }: ReturnType<typeof stopChatTyping>,
): SagaIterator {
  yield call(realtime.publishTyping, { ...payload, isTyping: false })
}

function* runAuthenticatedChatWorkflow(
  ports: ChatWorkflowPorts,
  _action: ReturnType<typeof startChatWorkflow>,
): SagaIterator {
  yield fork(runRealtimeConnection, ports.realtime)
  yield fork(watchChatOnlineStatus, ports.realtime)
  yield fork(runPresenceHeartbeat, ports.realtime)
  yield take(CHAT_WORKFLOW_STOPPED)
}

export function* createChatWorkflowSaga({
  drafts,
  realtime,
}: ChatWorkflowPorts): SagaIterator {
  yield takeLatest(CHAT_WORKFLOW_STARTED, runAuthenticatedChatWorkflow, {
    drafts,
    realtime,
  })
  yield takeEvery(
    CHAT_THREAD_OPENED,
    function* ({ payload }: ReturnType<typeof openChatThread>) {
      yield* restoreChatThreadDraft(drafts, payload)
    },
  )
  yield debounce(300, CHAT_DRAFT_CHANGED, persistChatDraft, drafts)
  yield takeEvery(CHAT_DRAFT_CLEARED, removeChatDraft, drafts)
  yield takeLatest(CHAT_TYPING_ACTIVITY, publishTypingActivity, realtime)
  yield takeEvery(CHAT_TYPING_STOPPED, publishTypingStop, realtime)
}
