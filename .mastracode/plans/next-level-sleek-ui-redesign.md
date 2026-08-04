# Take the Entire App to a Sleek, Product-Grade UI

### Overview

Replace the current partially polished but still generic UI with one coherent, light-first product system inspired by Linear’s restraint and density—not a clone. The redesign will use quiet neutral surfaces, precise Inter typography, Tabler outline icons, compact controls, minimal containers, and deliberate hierarchy. It covers the public landing page, auth, authenticated shell, Todos, founder chat, owner inbox/thread, Settings, notifications, and every responsive state while preserving all existing behavior. Implementation must proceed through screenshot approval gates: foundations/components, shell + Todos, and founder chat/owner inbox. A rejected checkpoint is revised before later surfaces are migrated.

### Complexity Estimate

- **Size**: Large (30+ component, style, route-integration, and test files)
- **Risk**: Medium (broad presentation/responsive work; product behavior remains unchanged)
- **Dependencies**: No new runtime packages. Continue with Vanilla Extract, Inter, existing Tabler Icons, Testing Library, Storybook, Playwright, and Axe. No component framework, utility-CSS migration, or additional icon library.

### Visual Contract

- **Personality**: calm, precise, editorial, capable; never decorative, gamified, or “template SaaS.”
- **Light-first palette**: warm-neutral canvas, crisp white working surfaces, low-contrast borders, near-black text, one restrained blue action color. Cyan is reserved for rare status/accent use—not broad decoration.
- **Typography**: five semantic roles only—page title 20–24px/600, section title 14–16px/600, body and controls 14px, supporting text 12–13px, metadata 11–12px. Monospace only for genuinely technical values. Avoid uppercase eyebrows, giant display headings, aggressive negative tracking, and decorative numbering.
- **Geometry**: 6–8px radii for controls/surfaces, mostly 1px dividers, minimal shadows, 36–40px desktop controls, 44px mobile targets. Prefer rows, sections, and whitespace over nested cards.
- **Iconography**: Tabler outline icons only, generally 16px in controls and 18px in primary navigation, 1.75–2 stroke. Decorative icons are hidden from assistive technology; icon-only actions retain explicit labels/tooltips.
- **Motion**: 120–180ms state transitions only; no layout theatrics. Fully honor reduced motion.
- **Responsive model**: desktop left rail; tablet compact top bar plus intentionally designed navigation; mobile top bar/account menu plus safe-area-aware bottom primary navigation. Only one navigation representation is visible at each breakpoint.

### Steps

1. **File**: `app/design-system/tokens/{colors,typography,spacing,radii,shadows,motion}.css.ts`, `app/design-system/theme.css.ts`, `app/design-system/global.css.ts`
   **Change**: Consolidate the expanded but inconsistent token set into semantic surface, text, border, action, status, density, typography-role, and responsive-layout tokens. Tune light and dark palettes independently; remove unused/decorative token choices and establish a strict five-role type scale.
   **Why**: Current pages still choose arbitrary sizes such as 3xl/4xl and broad blue/cyan treatments, producing inconsistent hierarchy despite a shared theme.

2. **File**: `app/components/ui/{button,input,field,card,badge,tabs,separator,empty-state,page-header,status-dot,skeleton}*` and Storybook/test files
   **Change**: Rebuild primitives around the visual contract: compact controls, flatter surfaces, clear interaction states, restrained badges, line-style tabs, compact empty states, consistent icon slots, and accessible loading/error/success treatments. Remove variants that duplicate page-specific decoration and add stories for real dense states, long labels, dark mode, and narrow widths.
   **Why**: Existing primitives still encourage rounded cards, pill filters, shadows, and oversized empty states that made earlier checkpoints feel like a component-library demo.

3. **File**: `app/components/app-shell/app-shell.tsx`, `app-shell.css.ts`, `app-shell.test.tsx`, authenticated route integration files
   **Change**: Finalize one responsive shell: compact desktop rail with Tabler icons and readable labels; tablet top navigation that does not collide with account actions; mobile top account control plus bottom Todos/Chat navigation; contextual unread badge; Settings/logout placement; long-email handling; owner access without duplicate navigation in the accessibility tree.
   **Why**: The current shell switches the desktop navigation into a fixed bottom bar at 64rem and duplicates desktop/mobile account markup, which has already caused tablet/mobile breakage and test ambiguity.

4. **File**: `app/features/todos/application/{todos-page,todo-item,todo-item-edit,filter-tabs}.tsx`, corresponding `.css.ts` and tests
   **Change**: Make Todos a compact task workspace: modest title bar, low-priority account notices, single-line quick capture that progressively reveals optional description, flat list rows with clear completion/edit actions, line-style filters/counts, compact empty state, and responsive actions. Eliminate large panels and redundant count/footer chrome.
   **Why**: The current page still wraps capture and tasks in bordered panels and gives setup notices and empty states too much visual weight.

5. **File**: screenshot fixture/test under `playwright/e2e/` (temporary if appropriate), `test-results/` checkpoint artifacts
   **Change**: Capture populated and empty Todos states at desktop, tablet, and mobile widths in light and dark modes. Run focused component tests, responsive keyboard checks, and Axe. Stop for explicit screenshot approval; revise Steps 1–4 until approved.
   **Why**: Previous broad migrations continued despite disliked checkpoints. This gate prevents an unapproved visual foundation from spreading.

6. **File**: `app/features/chat/application/{chat-thread,owner-chat-dashboard,owner-onboarding-page,chat-notification-provider}*`, `app/routes/chat.tsx`, `app/routes/owner.chats*.tsx`, related tests
   **Change**: Redesign founder chat as a focused communication workspace. Use a stable-height thread, compact identity/presence header, narrow readable message measure, subtle sender differentiation, grouped timestamps/read receipts, attachment rows with type/size affordances, sticky single-surface composer with compact attachment action, and clear sending/error states. On desktop, present the owner inbox and selected thread as a master-detail workspace; on mobile, preserve route-based inbox/thread navigation with a clear back action and no overflow.
   **Why**: Current chat is a generic centered list with large rounded bubbles and a stacked form/file input; the owner dashboard is a disconnected list of card links rather than an inbox.

7. **File**: chat screenshot fixture/test and representative checkpoint artifacts under `test-results/`
   **Change**: Capture user chat (empty, active, attachment, unread/read), owner inbox, and owner thread at desktop/mobile in light/dark modes. Verify presence and read state are not color-only, keyboard order, long messages/emails, file controls, and Axe. Stop for explicit screenshot approval before migrating the remaining screens.
   **Why**: Founder chat is a signature feature and requires its own design approval rather than inheriting assumptions from Todos.

8. **File**: `app/features/auth/application/{auth-page.css,signin-page,signup-page,verify-page,login-page}*`, tests
   **Change**: Apply an understated branded auth frame with compact headings, visible labels, clear email-first progression, calm validation/loading states, polished verification-code entry, and mobile keyboard/autofill behavior. Preserve email-first signup and post-verification passkey setup exactly.
   **Why**: Current auth typography still uses a 4xl centered heading and reads as a generic standalone form rather than the same product.

9. **File**: `app/features/todos/application/landing-page*`, tests
   **Change**: Recompose the landing page with a smaller editorial hero, credible product screenshot/preview matching the approved app UI, concise product benefits integrated into page rhythm rather than three generic cards, and consistent auth CTAs. Avoid invented metrics, gradients, huge display type, and separate marketing-only component styling.
   **Why**: The current 4.75rem hero, rounded demo rows, and three-card benefits section conflict with the compact authenticated product.

10. **File**: `app/features/auth/application/{settings-page,appearance-control}*`, authenticated Settings route integration and tests
    **Change**: Put Settings inside the approved shell and use a two-level settings layout: compact section navigation on larger screens and stacked sections on mobile. Present Appearance, Account, Passkeys, founder-chat role, and notification configuration as rows with concise status badges and right-aligned actions. Keep Light/Dark/System persistent and ensure theme changes do not flash.
    **Why**: Current Settings is a stack of repeated cards and raw status sentences with weak action hierarchy.

11. **File**: notification, notice, progress, error boundary, loading/empty state components and affected route surfaces
    **Change**: Standardize transient and persistent feedback: inline setup notices, toast/in-app chat notifications, progress/loading, route errors, offline/reconnect state, destructive confirmations, and skeletons. Use consistent icon, title, detail, action, and dismissal patterns without allowing banners to dominate primary work.
    **Why**: Product polish depends on secondary states, and the current passkey/email notices already overpower the core workspace.

12. **File**: migrated component tests, Storybook stories, `playwright/e2e/*.e2e.ts`, optional `README.md` design-system section
    **Change**: Add representative responsive, dark-theme, keyboard, long-content, and visual-state coverage; extend Axe to landing, auth, Todos, Settings, user chat, owner inbox, and owner thread. Remove superseded CSS exports and page-specific button/card clones, then document typography, density, icon, and surface rules.
    **Why**: The redesign must remain coherent after this pass and must not regress navigation, accessibility, or product behavior.

### Delivery and Approval Gates

1. **Foundation + primitives** — implement and verify shared visual rules.
2. **Shell + Todos** — produce six representative screenshots (desktop/tablet/mobile, light/dark) and wait for explicit approval.
3. **Founder chat + owner inbox** — produce representative user/owner screenshots and wait for explicit approval.
4. **Landing + auth** — migrate only after both product checkpoints are approved.
5. **Settings + feedback states + cleanup** — finish migration and system documentation.

Do not commit a visual phase until its required checkpoint is approved. Do not start or restart the user’s development server; provide the manual `pnpm dev` command and use isolated automated preview/test processes only when required.

### Verification

- **Per step**: focused Testing Library/Vitest tests, `pnpm typecheck`, Biome on affected files, and `git diff --check`.
- **Per phase**: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Vitest must continue using isolated `prisma/test.db` so browser sessions in `prisma/dev.db` remain intact.
- **Responsive**: verify 320px, 390px, 768px, 1024px, 1440px, and wide desktop; test no clipping, duplicate navigation, fixed-element overlap, or unsafe-area collisions.
- **Accessibility**: keyboard-only traversal, visible focus, correct landmarks/headings, 200% zoom, 44px mobile targets where practical, semantic labels, non-color status cues, reduced motion, and Axe in light/dark modes.
- **Content stress**: long emails, long todo titles/descriptions, long chat messages, multiple attachments, large unread counts, empty/loading/error states, and owner/user role differences.
- **Behavior preservation**: re-run existing auth, todo, chat, owner, notifications, passkey, attachment, presence, and read-receipt tests without changing domain or route-action behavior.

### Risks and Guardrails

- Preserve all auth, todo, chat, owner, notification, attachment, presence, read-receipt, and passkey behavior.
- Do not introduce a UI framework, second icon library, gradients, glass effects, decorative monospace, fake branding, invented metrics, oversized typography, or nested card layouts.
- Do not copy Linear branding or exact proprietary layouts; use its restraint, density, and interaction quality as directional reference only.
- Avoid arbitrary CSS values when a semantic token applies, but do not over-abstract one-off layout constraints that are genuinely page-specific.
- Light mode is the primary art direction; dark mode receives independent tuning and equal functional/accessibility verification.
- Keep screenshot comparisons at fixed data states and viewport sizes so approval feedback reflects design changes rather than content changes.
- If a checkpoint is rejected, revise that phase only; do not migrate later screens or declare the redesign complete.
