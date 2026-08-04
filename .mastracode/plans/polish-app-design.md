# Polish the App with a Developer-Modern Design System

### Overview

Redesign the app around a **developer-modern** visual direction: precise typography, compact but breathable information layouts, strong hierarchy, restrained blue/cyan accents, subtle technical details, and first-class dark mode. The work should preserve all existing product behavior while making the landing, authentication, todos, chat, owner dashboard, settings, notices, forms, and empty/loading/error states feel like one cohesive product rather than independently styled screens. The implementation should begin with reusable foundations and shared shell/components, then migrate screens in controlled phases so the app remains functional and testable throughout.

### Complexity Estimate

- **Size**: Large (6+ files; likely 25–40 UI, token, component, and test files)
- **Risk**: Medium (broad presentation and responsive changes, but no intended server/domain behavior changes)
- **Dependencies**: Prefer no new runtime packages. Reuse Vanilla Extract, existing Inter assets, current UI primitives, Storybook, Testing Library, Playwright, and `@axe-core/playwright`. Add an icon package only if the existing project has no suitable icon source and consistent icons cannot reasonably be implemented locally.

### Design Direction

- Use a neutral slate foundation with a crisp electric blue/cyan accent rather than introducing many decorative colors.
- Make typography carry hierarchy: stronger display/page-title styles, compact labels and metadata, tabular/monospace treatment only where it adds technical clarity.
- Use borders, layered surfaces, and very restrained shadows; avoid oversized rounded cards and generic gradient-heavy SaaS styling.
- Introduce a consistent authenticated application shell with brand, primary navigation, context-aware unread badges, account/settings access, and responsive mobile navigation.
- Treat dark mode as an equal design target, not an automatic token inversion.
- Keep interaction feedback fast and understated, with explicit hover, pressed, loading, success, error, empty, and focus-visible states.
- Maintain WCAG 2.1 AA contrast, semantic landmarks, visible labels, 44px touch targets where practical, logical keyboard order, reduced-motion support, and no information conveyed only by color.

### Steps

1. **Files**: `app/design-system/tokens/colors.css.ts`, `typography.css.ts`, `spacing.css.ts`, `radii.css.ts`, `shadows.css.ts`, `motion.css.ts`, `app/design-system/theme.css.ts`, `app/design-system/global.css.ts`
   **Change**: Expand the semantic token contract for elevated/sunken surfaces, interactive states, accent/subtle accent, success/warning/danger treatments, stronger text hierarchy, control sizing, responsive content widths, and reduced-motion behavior. Refine light and dark palettes independently and add consistent global selection, scrollbar, focus, body, and typography defaults.
   **Why**: The current system has only three background values, two borders, and limited intent colors, which forces pages to improvise styles and prevents coherent visual depth or status treatments.

2. **Files**: `app/components/ui/button.*`, `input.*`, `textarea.*`, `field.*`, `card.*`, `badge.*`, `tabs.*`, `separator.*`, plus focused Storybook stories and component tests
   **Change**: Normalize control heights, radii, typography, icon spacing, hover/pressed/focus/disabled/loading states, field descriptions/errors, card density variants, badge intent variants, and responsive tab behavior. Add only the small missing primitives needed by multiple screens, such as an app-link button style, status dot, page header, empty state, and skeleton/loading surface.
   **Why**: Shared primitives must establish the polish before individual pages are migrated; otherwise visual inconsistencies will be duplicated across features.

3. **Files**: new shared application-shell component/style/test files under `app/components/` or `app/features/app-shell/`, plus `app/root.tsx` and authenticated route integration points
   **Change**: Build a responsive authenticated shell with compact brand treatment, primary links for Todos and Chat, owner-only dashboard access, unread badge support, Settings/account controls, clear active-route state, desktop header/sidebar behavior as appropriate, and an accessible mobile navigation pattern.
   **Why**: `todos-page.tsx` currently owns several ad hoc header links, while chat/settings pages each implement their own back navigation. A shell creates a consistent product frame and removes repeated navigation styling.

4. **Files**: `app/features/todos/application/landing-page.tsx`, `landing-page.css.ts`, and tests
   **Change**: Restyle the public landing page to match the developer-modern product: sharper brand/nav, stronger hero hierarchy, a realistic polished product preview, restrained technical accents, consistent CTA styling, social/reassurance detail without invented claims, and responsive layouts from narrow mobile through desktop.
   **Why**: The landing page sets expectations for the product; it should visually match the authenticated experience rather than feel like a separate marketing template.

5. **Files**: auth application pages/styles/tests including `auth-page.css.ts`, `signin-page.tsx`, `signup-page.tsx`, `verify-page.tsx`, and `login-page.tsx`
   **Change**: Create a unified auth layout with branded context, concise email-first flow, polished code-entry state, clearer progress/help copy hierarchy, consistent validation and submission feedback, and mobile-safe keyboard/input behavior. Preserve the newly implemented email-first signup and post-verification passkey setup.
   **Why**: Authentication is a critical first-use experience and must reinforce trust while keeping the current secure flow unchanged.

6. **Files**: todo application files including `todos-page.*`, `todo-item.*`, `todo-item-edit.*`, `filter-tabs.*`, and tests
   **Change**: Migrate Todos into the shared shell; redesign the composer as a purposeful capture surface, improve filter/count hierarchy, compact task rows, completed/editing states, metadata, notices, empty states, responsive action placement, and mobile touch interactions. Replace text-only navigation and parenthetical unread counts with shared navigation/badge primitives.
   **Why**: Todos is the app’s main workspace and currently uses a narrow single-column form with an ad hoc header, leaving the largest opportunity for perceived quality improvement.

7. **Files**: chat application files including `chat-thread.*`, `owner-chat-dashboard.*`, `owner-onboarding-page.*`, notification UI, and tests
   **Change**: Give chat a workspace-quality layout with stable viewport composition, distinct but restrained message bubbles, timestamps/read receipts, attachment cards, persistent composer, polished presence/unread indicators, owner conversation list hierarchy, selected-thread behavior on larger screens, and focused mobile navigation.
   **Why**: Chat currently has correct functionality but minimal styling; the owner dashboard and thread should feel like a cohesive communication tool and clearly communicate privacy, presence, and read state.

8. **Files**: `app/features/auth/application/settings-page.*` and tests
   **Change**: Organize settings into clear sections for account, passkeys, chat role, and notification configuration; improve status presentation, destructive-action confirmation/placement, success/error feedback, and responsive density. Use shared cards, badges, page headers, and buttons rather than page-specific equivalents.
   **Why**: Settings currently presents raw status sentences and repeated cards without enough grouping or hierarchy.

9. **Files**: all migrated page/component tests, Storybook stories, and `playwright/e2e/*.e2e.ts`
   **Change**: Update role/text assertions only where presentation changes require it; add visual-state coverage for shared primitives, mobile navigation, empty/error/loading states, dark theme, owner/user chat states, and responsive layouts. Extend Axe checks to landing, auth, todos, settings, chat, and owner dashboard routes.
   **Why**: Broad visual work can silently introduce navigation, focus, contrast, overflow, and responsive regressions unless representative states are explicitly covered.

10. **Files**: affected CSS/component files and optionally `README.md` design-system guidance
    **Change**: Perform a final consistency pass for spacing rhythm, border/radius usage, title hierarchy, copy tone, icon sizing, focus states, motion, dark mode, and mobile overflow. Remove superseded page-specific styles and document the semantic token/component conventions developers should use.
    **Why**: The redesign is complete only when exceptions and duplicate styles are removed and future work has a clear path to stay consistent.

### Delivery Strategy

Implement as reviewable phases rather than one oversized visual rewrite:

1. **Foundation PR/commit** — semantic tokens, global styles, and UI primitives.
2. **Shell + core workspace PR/commit** — authenticated shell and Todos.
3. **Entry flows PR/commit** — landing and auth.
4. **Communication PR/commit** — chat, owner dashboard, notifications, presence.
5. **Settings + final QA PR/commit** — settings, dark mode, responsive/a11y polish, documentation.

Each phase should leave all existing behavior working and pass its focused tests before proceeding.

### Verification

- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` after each phase.
- Run focused Happy DOM tests for every changed component and route-level tests where loaders/actions are unaffected but render contracts change.
- Run Playwright on desktop and mobile viewport projects for landing, signup/verification, todos, settings, user chat, and owner dashboard.
- Run Axe checks on each primary route in both light and dark themes where supported.
- Manually verify keyboard-only navigation, visible focus, mobile navigation, form errors, loading/disabled controls, long todo/message text, long email addresses, unread badges, empty lists, attachment cards, and destructive actions.
- Check light/dark contrast against WCAG AA and verify that status/presence/read information is not color-only.
- Check `prefers-reduced-motion`, 200% zoom, narrow 320px layouts, tablet widths, and large desktop widths.
- Compare representative before/after screenshots at consistent viewport sizes to catch regressions in hierarchy and density.

### Risks and Guardrails

- Do not alter authentication, todo, chat, owner, notification, or passkey behavior as part of visual cleanup.
- Avoid introducing a large third-party component framework that conflicts with the existing Vanilla Extract system.
- Avoid one-off colors, spacing values, shadows, and link-button copies when semantic tokens or shared primitives should be used.
- Do not overuse monospace type, neon accents, gradients, glass effects, or animation; the developer-modern direction should remain professional and readable.
- Preserve semantic HTML and existing accessible labels while restructuring layouts.
- If the shell architecture requires route-level data changes, keep them minimal and separately tested from presentation work.
- Treat screenshot approval of the foundation, Todos, and chat direction as checkpoints before migrating every remaining screen.
