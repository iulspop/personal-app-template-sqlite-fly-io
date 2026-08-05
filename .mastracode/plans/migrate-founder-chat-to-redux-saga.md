# Migrate Founder Chat to Redux Saga Workflows

### Overview

Establish the project’s first intentional vanilla Redux + React Redux + Redux Saga pattern by moving only founder chat’s client-owned orchestration into Redux: resilient realtime connection management, per-conversation drafts, typing indicators, presence heartbeats, and in-app chat notifications. React Router remains authoritative for authentication, conversations, canonical messages, read state, actions, and database data; message history is never mirrored into Redux. Browser/network/storage effects sit behind typed ports and client adapters, while reducers/selectors/domain decisions remain pure and immutable.

### Complexity Estimate

- **Size**: Large (25+ files across dependencies, store composition, chat workflow, server typing transport, UI, tests, docs, and architecture rules)
- **Risk**: High — changes global authenticated client composition, replaces two existing realtime hooks, introduces reconnect/concurrency behavior, and adds ephemeral server state; canonical chat behavior remains unchanged to limit risk.
- **Dependencies**: Add `redux`, `react-redux`, and `redux-saga` only. Add one Prisma migration for expiring typing state. No Redux Toolkit, RTK Query, thunks, listener middleware, Immer, external realtime service, or service worker.

### Steps

1. **Add dependencies and lock the state-ownership contract**
   - **Files**: `package.json`, `pnpm-lock.yaml`, `AGENTS.md`, `README.md`
   - **Change**: Add vanilla Redux, React Redux, and Redux Saga. Document the concrete rule that Redux owns chat connection/draft/typing/notification workflow state while React Router owns messages, conversations, mutations, sessions, and database state. Preserve the existing `CLAUDE.md -> AGENTS.md` symlink.
   - **Why**: Makes the intended pattern explicit and prevents future AI changes from turning Redux into a second server-data cache.

2. **Define pure chat workflow state and decisions with failing tests first**
   - **Files**: create `app/features/chat/domain/chat-workflow-domain.ts`, `app/features/chat/domain/chat-workflow-domain.test.ts`; update `app/features/chat/domain/chat-constants.ts`
   - **Change**: Define serializable connection states (`idle`, `connecting`, `connected`, `reconnecting`, `offline`), realtime snapshot and typing-state types, bounded reconnect-delay calculation, typing expiry/visibility decisions, and draft key construction scoped by viewer and conversation. Add constants for reconnect bounds, typing publish throttle, typing idle timeout, and typing expiry.
   - **Why**: Keeps timing and state decisions pure, deterministic, independently testable, and free from Redux/browser imports.

3. **Create typed client-effect ports and browser adapters with failing tests first**
   - **Files**: create `app/features/chat/domain/chat-workflow-ports.ts`, `app/features/chat/infrastructure/chat-realtime.client.ts`, `chat-realtime.client.test.ts`, `chat-drafts.client.ts`, `chat-drafts.client.test.ts`
   - **Change**: Define ports for opening/closing authenticated EventSource connections, publishing typing/presence, observing online/visibility state, scheduling delays, and reading/writing/removing local drafts. Implement EventSource, fetch, browser lifecycle, timer, and `localStorage` adapters without importing globals from reducers/selectors/sagas. Namespace draft storage by viewer ID and conversation ID and tolerate unavailable storage without exposing another user’s draft.
   - **Why**: Enforces the requested “effects at the boundary” flow and gives sagas replaceable, testable dependencies.

4. **Build the feature-colocated Redux slice using TDD**
   - **Files**: create `app/features/chat/application/chat-workflow/chat-workflow-actions.ts`, `chat-workflow-reducer.ts`, `chat-workflow-reducer.test.ts`, `chat-workflow-selectors.ts`, `chat-workflow-selectors.test.ts`
   - **Change**: Add explicit action constants/typed creators, a total immutable reducer, and selectors for connection status, unread count, active typing conversations, the active conversation draft, and notification visibility. Store no message objects, loader payloads, `File` objects, `EventSource` instances, callbacks, promises, or other non-serializable values.
   - **Why**: Provides a small functional state model focused strictly on client-owned workflow state.

5. **Implement and test Redux Sagas before wiring UI**
   - **Files**: create `app/features/chat/application/chat-workflow/chat-workflow-sagas.ts`, `chat-workflow-sagas.test.ts`
   - **Change**: Add small worker/watch sagas for one authenticated realtime connection, explicit close/reconnect with bounded exponential backoff, online/offline and visibility coordination, presence heartbeat lifecycle, snapshot handling, throttled typing publication with idle-stop, draft restore/debounced persistence/removal, and notification updates. Use injected ports and declarative saga effects; cancel conversation-bound typing/draft work when a thread closes and cancel all work on provider teardown/auth loss.
   - **Why**: This is the orchestration complexity that justifies Saga while keeping decisions and IO separate.

6. **Add the root store composition and authenticated provider with tests first**
   - **Files**: create `app/store/create-store.ts`, `app/store/root-reducer.ts`, `app/store/root-saga.ts`, `app/store/store-provider.tsx`, `app/store/store-provider.test.tsx`; modify `app/root.tsx`
   - **Change**: Compose `legacy_createStore`, `combineReducers`, and Saga middleware only; inject concrete chat ports at the composition root. Create one store per browser/SSR render, start sagas only on the client, expose typed dispatch/selector hooks, and mount the provider only for authenticated content where `ChatNotificationProvider` currently sits.
   - **Why**: Establishes an AI-followable project pattern without adding Redux to logged-out pages or allowing cross-request store state on SSR.

7. **Persist expiring typing indicators securely with integration tests first**
   - **Files**: modify `prisma/schema.prisma`; create `prisma/migrations/<timestamp>_add_chat_typing_state/migration.sql`; modify `app/features/chat/infrastructure/chat-model.server.ts`; add/update `chat-model.server.spec.ts` and factories as needed
   - **Change**: Add one typing-state row per conversation/user with an expiry timestamp. Add single-purpose model operations to upsert/clear typing and retrieve only unexpired typing by authorized participant/conversation. Treat expiry as cleanup so stale rows never render as active.
   - **Why**: Avoids process-local typing state, works with the existing SQLite/Fly deployment, survives reconnects, and remains safe if the app later runs more than one process sharing the database.

8. **Add authenticated typing transport and enrich SSE snapshots using TDD**
   - **Files**: create `app/routes/chat.typing.tsx`, `app/routes/chat.typing.test.ts`; modify `app/features/chat/domain/chat-schemas.ts`, `app/routes/chat.events.tsx`, `app/routes/chat.events.test.ts`, `app/features/chat/infrastructure/chat-model.server.ts`
   - **Change**: Add a structurally validated POST intent for typing start/stop that requires authentication and conversation participation, returns non-enumerating failures, and uses private/no-store headers. Extend `/chat/events` snapshots with active opposite-participant typing conversation IDs while retaining unread/latest-message fields and private SSE headers. Do not include message bodies or participant data in snapshots.
   - **Why**: Supplies the saga workflow with secure, minimal realtime state while canonical messages remain loader-owned.

9. **Replace duplicate realtime hooks with one Redux/Saga connection**
   - **Files**: modify `app/features/chat/application/chat-notification-provider.tsx`, `chat-notification-provider.test.tsx`; remove `use-chat-events.ts` and `use-presence-heartbeat.ts` after consumers migrate; add a small React Router revalidation bridge under `app/features/chat/application/chat-workflow/`
   - **Change**: Replace provider-local EventSource, heartbeat, unread, and toast state with actions/selectors. Let the bridge call React Router `revalidate()` when the Redux snapshot sequence changes, keeping route loaders authoritative. Render restrained accessible connection/reconnect/offline feedback and preserve notification dismissal/`aria-live` behavior.
   - **Why**: Eliminates today’s duplicate EventSource connections from the global provider and active thread while preserving React Router data ownership.

10. **Migrate the chat composer to Redux-backed drafts with render tests first**
    - **Files**: modify `app/features/chat/application/chat-thread.tsx`, `chat-thread.test.tsx`, `chat-thread.css.ts`, `app/routes/chat.tsx`, `app/routes/owner.chats.$conversationId.tsx`
    - **Change**: Pass viewer/conversation workflow identity from authenticated loaders, dispatch thread-open/thread-close lifecycle facts, and control only the message body through draft selectors/actions. Restore drafts across navigation/reload, debounce persistence, preserve drafts on send failure, and clear Redux plus persisted draft only after successful React Router action completion. Keep selected attachments local and non-persistent; preserve Enter/Shift+Enter, attachment queue, successful reset, scrolling, and mobile full-height behavior.
    - **Why**: Adds durable per-account/per-conversation drafts without moving forms, files, message submission, or message history into Redux.

11. **Render and publish typing state in active chat surfaces with tests first**
    - **Files**: modify `app/features/chat/application/chat-thread.tsx`, `chat-thread.test.tsx`, `chat-thread.css.ts`, `owner-chat-dashboard.tsx`, `owner-chat-dashboard.test.tsx` (create if absent), and related CSS
    - **Change**: Dispatch draft/input activity to the typing saga, stop on idle/send/close/blur as appropriate, and show “Founder is typing…” or participant-specific owner text only while an unexpired opposite-participant indicator exists. Add polite, non-disruptive accessibility announcements and compact owner-inbox typing status without causing layout overflow.
    - **Why**: Completes the user-visible typing feature for both one-to-one user chat and the founder’s one-to-many inbox.

12. **Extend architecture enforcement for Redux/Saga boundaries using TDD**
    - **Files**: modify `scripts/check-architecture.ts`, `scripts/check-architecture.test.ts`
    - **Change**: Reject direct browser/network/storage/timer globals in reducers, selectors, and sagas; reject Redux imports in domain files; reject infrastructure imports from reducers/selectors; and ensure concrete client adapters are assembled only at the store composition boundary. Keep current domain/infrastructure/presentation checks passing.
    - **Why**: Turns the documented functional/effect-boundary rules into enforceable constraints for future developers and coding agents.

13. **Add end-to-end realtime workflow coverage**
    - **Files**: modify `playwright/e2e/chat.e2e.ts`; update focused helpers/factories if required
    - **Change**: Extend the existing separate owner/user flow to assert message updates without manual reload, typing appears and expires/clears, a draft survives navigation/reload and clears after successful send, offline mode reports disconnection, reconnection restores live updates without duplicate notifications, and private conversation isolation remains intact. Run Axe and horizontal-overflow checks on affected chat states.
    - **Why**: Verifies the complete browser/server workflow rather than only reducer and saga mechanics.

14. **Document, clean up, and perform final regression verification**
    - **Files**: `README.md`, affected tests/config, deleted obsolete hooks; no unrelated feature changes
    - **Change**: Document state ownership, action → saga → port → adapter flow, connection/draft/typing behavior, localStorage scope, and operational limits. Remove dead hook code and confirm no canonical messages are stored in Redux.
    - **Why**: Leaves one coherent reference implementation rather than parallel legacy and Redux paths.

### Verification

- Follow Red-Green-Refactor for every domain, reducer, selector, saga, adapter, route, model, render, and E2E change; use `given: ..., should: ...` test names and project factories.
- Run focused Vitest files after each step, including pure workflow decisions, reducers/selectors, yielded saga effects/cancellation, client adapters, Prisma typing operations, typing route authorization, provider, composer, and owner dashboard.
- Run `pnpm check:architecture` and verify the new Redux/Saga boundary rules fail against fixtures with forbidden direct effects/imports and pass the real project.
- Run `pnpm lint`, `pnpm typecheck`, full isolated `pnpm test`, `pnpm build`, and `git diff --check`.
- Run only the focused E2E file during development: `pnpm test:e2e -- playwright/e2e/chat.e2e.ts --project=chromium`; do not run the full E2E suite in bulk.
- Confirm `prisma/dev.db` checksum is unchanged by automated tests and migrations use isolated test/E2E databases.
- Manually verify desktop/mobile user chat and founder inbox/thread: connection status, reconnect after network interruption, no duplicate EventSource connection/notification, typing start/idle/expiry, draft isolation between users/conversations, failed-send preservation, successful-send clearing, attachments, Enter/Shift+Enter, read indicators, presence, and mobile overflow.
- Confirm Redux DevTools/state contains only serializable client workflow data and never message history, attachment `File` objects, session secrets, participant-private data from other conversations, callbacks, promises, or transport instances.
- Risks to watch: reconnect storms or duplicate subscriptions, revalidation loops, typing write volume, stale typing after abrupt closes, draft leakage across accounts, SSR singleton stores/sagas, notification duplication, and loss of existing composer behavior.
- Do not start or restart the user’s development server. Do not commit or push until the user explicitly requests it.
