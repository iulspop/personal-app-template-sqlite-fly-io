# Add owner live chat

### Overview

Add authenticated, per-user live chat with one globally claimed owner seat. Each regular user sees only their private conversation with the owner; the owner gets a dashboard containing every user conversation. The feature uses an Infisical-configured owner email allowlist, Resend email, Twilio SMS, authenticated file storage on the existing Fly `/data` volume, server-sent events (SSE) for near-real-time updates, heartbeat-based online/last-seen presence, and per-participant read receipts. The design deliberately targets the existing single-machine SQLite/Fly deployment and fewer than 1,000 users without introducing external realtime or object-storage infrastructure.

### Complexity Estimate

- **Size**: Large (new database models, routes, infrastructure adapters, UI, tests, deployment configuration, and documentation)
- **Risk**: High (new authorization boundary, user-uploaded files, realtime connections, external notifications, and schema migration)
- **Dependencies**: Add the Twilio Node SDK. Add Infisical `/web` values for `OWNER_EMAIL_ALLOWLIST`, `OWNER_PHONE_NUMBER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. Reuse Resend and the existing Fly `data` volume. No object-storage or hosted realtime dependency.

### Steps

1. **File**: `prisma/schema.prisma`
   **Change**: Add a unique owner-role/claim representation, one conversation per non-owner user, messages with sender and timestamps, attachment metadata, per-participant read cursors/timestamps, notification-delivery records, and user presence (`lastSeenAt`). Add relations and indexes for conversation ordering, unread lookup, and message pagination.
   **Why**: Establishes enforceable one-owner, one-conversation-per-user, read-state, presence, and notification invariants in SQLite.

2. **File**: `prisma/migrations/<timestamp>_add_owner_chat/migration.sql`
   **Change**: Create the chat, ownership, attachment, receipt, notification, and presence tables/indexes generated from the schema; do not seed or auto-claim an owner.
   **Why**: Keeps production rollout explicit and compatible with the project’s manual Fly migration workflow.

3. **File**: `app/features/chat/domain/chat-constants.ts`, `app/features/chat/domain/chat-schemas.ts`, `app/features/chat/domain/chat-domain.ts`
   **Change**: Define intents, message/attachment limits, allowed MIME types, presence thresholds, notification cooldown, Zod validation, conversation authorization rules, unread calculations, and human-readable online/last-seen formatting.
   **Why**: Centralizes security-sensitive rules and keeps route handlers small and testable.

4. **File**: `app/features/chat/domain/chat-domain.test.ts`, `app/features/chat/domain/chat-schemas.test.ts`
   **Change**: Unit-test owner/user access decisions, unread/read transitions, online thresholds, last-seen labels, empty/oversized messages, and attachment validation.
   **Why**: Locks down the feature’s core privacy and state semantics before database and UI integration.

5. **File**: `app/features/chat/infrastructure/chat-model.server.ts`
   **Change**: Add Prisma queries for owner lookup/claim, idempotent conversation creation, paginated messages, owner conversation summaries, atomic message creation, attachment records, read-watermark updates, unread counts, and presence heartbeats.
   **Why**: Provides a single data-access boundary with ownership filters included in every sensitive query.

6. **File**: `app/features/chat/infrastructure/chat-model.server.spec.ts`
   **Change**: Integration-test sole-owner enforcement, conversation isolation, message ordering/pagination, unread counts, read updates, and presence persistence against the test database.
   **Why**: Prevents IDOR and data-consistency regressions in the most security-critical layer.

7. **File**: `app/features/chat/infrastructure/attachments.server.ts`
   **Change**: Store uploads outside the public web root under `/data/chat-attachments` in production and a test/temp directory elsewhere. Generate opaque IDs/file names, stream writes, enforce a 10 MB per-file limit and a conservative PNG/JPEG/WebP/PDF allowlist, and expose safe deletion/read helpers without trusting client file names or MIME headers alone.
   **Why**: Supports screenshots/files on the existing Fly volume while preventing executable uploads, traversal, public guessing, and excessive memory use.

8. **File**: `app/features/chat/infrastructure/attachments.server.spec.ts`
   **Change**: Test accepted uploads, rejected types/sizes, opaque storage names, cleanup on failure, and missing-file behavior.
   **Why**: Verifies the upload boundary independently from route rendering.

9. **File**: `app/features/chat/infrastructure/chat-email.server.ts`, `app/features/chat/infrastructure/chat-sms.server.ts`, `package.json`, `pnpm-lock.yaml`
   **Change**: Add a Resend owner-message email adapter and Twilio SMS adapter. Send only metadata and a secure dashboard link—not attachment contents or full sensitive messages in SMS. Return structured delivery results without logging secrets or phone numbers.
   **Why**: Implements owner email/text alerts with isolated, mockable providers and safer notification content.

10. **File**: `app/features/chat/infrastructure/chat-notifications.server.ts`, corresponding tests/mocks under `app/test/`
    **Change**: Orchestrate immediate in-app events and one email/SMS notification per unread conversation burst, suppress duplicate external notifications during a cooldown, record delivery attempts, and retry only on a later message rather than blocking message creation.
    **Why**: Meets the notification requirement without spamming the owner or making chat availability depend on third-party APIs.

11. **File**: `app/routes/owner.claim.tsx`, `app/features/chat/application/owner-onboarding-page.tsx`, `owner-onboarding-page.css.ts`, and tests
    **Change**: Add an authenticated onboarding screen available only when the current verified user’s normalized email is in `OWNER_EMAIL_ALLOWLIST`. Atomically claim the sole owner seat, collect/confirm the notification phone destination from the Infisical-configured owner number, explain notification behavior, and redirect an already-claimed owner to the dashboard. Show non-allowlisted users a generic unavailable state without exposing the allowlist.
    **Why**: Provides the requested claim flow while preventing an arbitrary first registrant from taking administrative access.

12. **File**: `app/routes/chat.tsx`, `app/features/chat/application/user-chat-page.tsx`, `user-chat-page.css.ts`, and tests
    **Change**: Add the regular user’s one-to-one view with the owner, chronological paginated messages, accessible composer, attachment picker/previews, upload progress/error states, online/last-seen owner status, incoming-message announcements, read indicators, and empty/unclaimed-owner states. Redirect the owner to the owner dashboard.
    **Why**: Delivers the private user experience and ensures users can never choose or inspect another conversation ID.

13. **File**: `app/routes/owner.chats.tsx`, `app/features/chat/application/owner-chat-dashboard.tsx`, `owner-chat-dashboard.css.ts`, and tests
    **Change**: Add the owner-only one-to-many dashboard with conversation list, user email, latest-message preview, timestamp, online state, unread badge, and sorting by latest activity. Support responsive list/detail navigation and a clear empty state.
    **Why**: Gives the owner a scalable overview of all private conversations while preserving one-to-one message views.

14. **File**: `app/routes/owner.chats.$conversationId.tsx`, shared chat thread/composer components and tests
    **Change**: Add the owner’s selected conversation view, enforce owner authorization server-side, support message sending/attachments, display user presence and read indicators, and mark messages read only when the conversation is visibly opened.
    **Why**: Completes the owner side without relying on client-provided ownership claims.

15. **File**: `app/routes/chat.attachments.tsx` or `app/routes/chat.attachments.$attachmentId.tsx`, plus route tests
    **Change**: Add authenticated upload/download endpoints. Verify that the requester is the owner or the conversation’s user before reading/writing, set safe `Content-Type`, `Content-Disposition`, `X-Content-Type-Options`, and private cache headers, and reject unauthorized IDs with a non-enumerating 404.
    **Why**: Keeps Fly-volume files private and prevents cross-conversation access.

16. **File**: `app/routes/chat.events.tsx`, `app/features/chat/application/use-chat-events.ts`, and tests
    **Change**: Add an authenticated SSE endpoint that emits new-message, read-state, presence, and unread-count events scoped to the requester. Use short database polling intervals, heartbeat comments, disconnect cleanup, and reconnect cursors. Add the client hook with backoff/revalidation behavior.
    **Why**: Provides reliable near-real-time chat on the existing single Fly machine without a paid realtime service or WebSocket server changes.

17. **File**: `app/routes/chat.presence.tsx`, `app/features/chat/application/use-presence-heartbeat.ts`, and tests
    **Change**: Send throttled heartbeats while the page is visible and the web app/PWA window is open, update immediately on visibility/focus changes, and derive “online” from a recent heartbeat while retaining `lastSeenAt` for offline display.
    **Why**: Implements online/last-online status accurately enough for browser and installed-PWA usage without claiming background availability.

18. **File**: `app/root.tsx`, `app/entry.server.tsx`, `app/features/chat/application/chat-notification-provider.tsx`, and tests
    **Change**: Mount authenticated in-app notification state, connect to scoped SSE events, show accessible live-region/toast notifications, maintain global unread counts, and confirm CSP `connect-src 'self'` supports same-origin SSE. Do not request browser push permission because push notifications were not requested.
    **Why**: Makes owner in-app notifications available across the application and keeps CSP/accessibility behavior explicit.

19. **File**: `app/routes/index.tsx`, `app/features/todos/application/todos-page.tsx`, related CSS/tests
    **Change**: Return the current user’s owner status and chat unread count. Add a regular-user “Chat with owner” link and an owner-only “Chat dashboard” link with unread badge in the authenticated page header; expose the owner-claim link only to an eligible allowlisted user while no seat is claimed.
    **Why**: Adds the requested main-page entry point without exposing owner controls to regular users.

20. **File**: `app/routes/settings.tsx`, `app/features/auth/application/settings-page.tsx`, related CSS/tests
    **Change**: Show role/owner status and, for the owner, notification-channel status plus links to onboarding/dashboard. Keep phone/provider credentials server-only and sourced from Infisical.
    **Why**: Gives the owner a durable place to understand and manage chat notification readiness.

21. **File**: `app/entry.server.tsx`, `app/utils/security-middleware.server.ts` if needed, upload/chat route headers
    **Change**: Review CSP and security headers for SSE and private downloads, preserve same-origin-only connectivity, and add route-level no-store/private caching where message or attachment data is returned.
    **Why**: Prevents chat content from being cached publicly and avoids weakening the existing security posture.

22. **File**: `.github/workflows/ci.yml`, `.github/workflows/pr.yml`, `README.md`, Infisical documentation references
    **Change**: Document required Infisical values, owner allowlist format, Twilio/Resend setup, `/data/chat-attachments` persistence, backup implications, manual production migration, notification cooldown semantics, and single-machine/SSE scaling assumptions. Ensure CI test secrets use non-delivering provider values/mocks and never contain real credentials.
    **Why**: Makes deployment reproducible and clearly states the operational limits of Fly-volume attachments and SQLite realtime polling.

23. **File**: `tests/chat.spec.ts`, `playwright/auth-utils.ts`, test factories as needed
    **Change**: Add end-to-end coverage for eligible owner claim, ineligible claim rejection, user send/owner receive, owner reply/user receive, attachment upload/download, online-to-last-seen transition, read indicators both ways, unread badges, and strict cross-user conversation/attachment isolation.
    **Why**: Verifies the complete multi-session behavior and authorization boundaries that component tests cannot prove.

### Verification

- Run `sfw pnpm install` after adding Twilio, then `socket scan create .` if required by the repository’s dependency policy.
- Run the new Prisma migration locally through `pnpm db:migrate:secrets -- add_owner_chat`; review generated SQL before production use.
- Run focused domain, model, route, component, notification-adapter, upload, SSE, and presence tests.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Run Playwright with two regular-user contexts plus one owner context; verify realtime delivery, unread/read transitions, presence timeout, and dashboard ordering.
- Run accessibility checks for keyboard-only message composition, focus after sends/uploads, live-region announcements, status text that does not rely on color, and responsive owner list/detail navigation.
- Manually verify Twilio and Resend in staging with test recipients, including provider failure: messages must persist even when notifications fail.
- Manually verify uploads survive a Fly deploy/restart, remain inaccessible without authorization, and cannot be fetched by another user guessing an attachment ID.
- Manually verify an allowlisted verified user can claim the owner seat exactly once, concurrent claims cannot create two owners, and non-allowlisted users cannot discover or access owner routes.
- Before production deploy, back up the SQLite database and Fly volume, run `pnpm db:migrate:prod:secrets` manually over Fly SSH, then deploy.
- Monitor SQLite lock duration and SSE connection count. If the app later scales beyond one machine, migrate attachment storage and realtime fan-out before adding replicas.

### Risks and Boundaries

- The current app is not an installable PWA. Presence will mean that an authenticated browser tab or future installed PWA window is visible/recently active; it will not imply background execution or device availability.
- Fly-volume attachments are appropriate for the stated sub-1,000-user, single-machine target but require volume backups and prevent horizontal app replicas without a later storage migration.
- External email/SMS delivery is best-effort and must never roll back or delay a persisted chat message.
- Owner claiming is restricted by the Infisical email allowlist and a unique database constraint; changing/transferring the owner is intentionally out of scope unless separately requested.
- Message deletion/editing, group chat, browser push, typing indicators, voice/video, malware scanning beyond strict type/size validation, and data-retention tooling are out of scope for this first version.
- No `vision.md` exists in the repository, so there was no project vision document available to validate this feature against.

### Completion Criteria

- Exactly one allowlisted verified account can claim the owner seat.
- Every non-owner account has access only to its own conversation with the owner.
- The owner dashboard lists and opens all user conversations with correct unread ordering.
- Messages and allowed attachments arrive near-real-time in both directions and remain private.
- Both participants see accurate read indicators and online/last-seen status.
- New user message bursts produce in-app, Resend email, and Twilio SMS owner notifications without blocking message persistence.
- Main navigation exposes the correct user or owner chat destination and unread count.
- Database, unit, integration, component, accessibility, and multi-session end-to-end checks pass.
- Production setup and operational limits are documented without storing secrets in the repository.
