# Add a Minimum Installable PWA Shell

### Overview

Add only the metadata and install assets required for the existing web app to be added to the home screen on iOS and Android and installed from supported desktop browsers. This phase will not add a service worker, offline fallback, Cache Storage, runtime caching, update prompts, background sync, push notifications, or offline application behavior. Existing auth, Todos, founder chat, observability, deployment, and test-database isolation remain unchanged.

### Complexity Estimate

- **Size**: Medium (approximately 6–10 source/config/asset/test files)
- **Risk**: Low — metadata and static install assets are additive and do not intercept requests or alter runtime data flow.
- **Dependencies**: No new runtime or PWA package. Reuse the existing `sharp` dependency only if deterministic PNG generation is needed. No external service or database migration.

### Steps

1. **Create a small application identity contract**
   - **File**: `app/config/app-config.ts` (create), `app/config/app-config.test.ts` (create)
   - **Change**: Define typed, immutable values needed by the document and manifest: app name, short name, description, locale, start URL, display mode, light/dark theme colors, background color, and icon declarations. Test required values, valid colors, root-relative URLs, and icon sizes/purposes.
   - **Why**: Keeps install metadata consistent without expanding this phase into broad product-copy configuration.

2. **Generate and check in minimum install icons**
   - **File**: `scripts/generate-pwa-assets.ts` (create), `public/icons/app-icon-source.svg` (create), `public/icons/pwa-192x192.png` (create), `public/icons/pwa-512x512.png` (create), `public/icons/pwa-maskable-512x512.png` (create), `public/apple-touch-icon.png` (create), `package.json`
   - **Change**: Add a deterministic Sharp-based `pnpm pwa:assets` script that creates standard Android/desktop icons, one safe-zone maskable icon, and an Apple touch icon from one source asset. Check generated images into the repository.
   - **Why**: These assets cover the practical install requirements across iOS, Android, and desktop while keeping rebranding straightforward.

3. **Serve a standards-compliant web app manifest**
   - **File**: `app/routes/manifest.webmanifest.ts` (create), `app/routes.ts`
   - **Change**: Add a public resource route that returns the manifest from `appConfig` with the correct manifest content type and fields for name, short name, description, start URL, scope, display, colors, and icons. Do not add shortcuts, screenshots, share targets, protocol handlers, or service-worker metadata.
   - **Why**: A route-based manifest can consume the same typed metadata as the SSR document without adding a build plugin or duplicated JSON file.

4. **Add install metadata to the SSR document**
   - **File**: `app/root.tsx`
   - **Change**: Use `appConfig` for the default document title and language; link the manifest and Apple touch icon; add description, application-name, mobile-web-app-capable, Apple mobile-web-app-capable/status-bar/title, format-detection, and light/dark theme-color metadata. Preserve route-specific titles, CSP nonce behavior, Sentry/PostHog initialization, and the existing theme bootstrap.
   - **Why**: Supplies browser and iOS-specific metadata required for a polished installed-app shell.

5. **Verify installability without adding offline behavior**
   - **File**: `playwright/e2e/pwa-install.e2e.ts` (create), existing Playwright configuration and scripts only if a focused command is useful
   - **Change**: Add production-mode assertions for manifest reachability/content, icon responses and dimensions, required document metadata, `display: standalone`, responsive rendering, and Axe results. Explicitly assert that the implementation does not register a service worker and does not create application Cache Storage entries.
   - **Why**: Confirms the app is install-ready while preventing accidental expansion into offline/runtime caching features.

6. **Document the minimum PWA contract**
   - **File**: `README.md`
   - **Change**: Document supported installation paths for iOS Safari, Android Chromium, and desktop Chromium-based browsers; the icon regeneration command; where app identity is configured; HTTPS/localhost requirements; and browser-dependent install UI. State explicitly that the template has no service worker, offline mode, update lifecycle, push notifications, background sync, or app-store packaging.
   - **Why**: Makes the intentionally minimal scope clear to future template users and avoids implying offline guarantees.

### Verification

- Run `pnpm pwa:assets` twice and confirm the second run creates no diff.
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` against isolated `prisma/test.db`.
- Run `pnpm build` and verify the manifest route and icon assets are included/served correctly.
- Run the focused Playwright install-shell test against the isolated E2E database/server.
- Confirm manifest fields, icon dimensions, theme colors, start URL, scope, and standalone display behavior.
- Confirm no service worker is registered, no application caches are created, and offline navigation behaves like an ordinary website rather than showing a custom fallback.
- Manually verify “Add to Home Screen” on iOS Safari and Android Chrome, plus installation from a supported desktop Chromium browser.
- Smoke-test auth, passkeys, Todos, founder chat/SSE/attachments, Settings, PostHog, and Sentry online.
- Run `git diff --check` and confirm generated icons are the only intentional binary files.

### Risks and Guardrails

- **Browser differences**: Installation wording and prompts vary; the template supplies installability metadata but does not force or simulate a browser install prompt.
- **No offline promise**: Do not add a service worker, Workbox, `vite-plugin-pwa`, offline fallback, precache, runtime cache, or update UI in this phase.
- **No request interception**: Authentication, private loaders, chat, SSE, attachments, mutations, and observability must continue using normal network behavior.
- **Asset quality**: Keep maskable safe zones and validate generated image dimensions/format.
- **Scope control**: Do not add setup initialization, broad product-copy replacement, push notifications, background sync, offline queues, app-store wrappers, or architecture refactoring.
- **Development environment**: Do not start or restart the user’s development server; use isolated verification processes only when needed.

### Completion Criteria

- The production app exposes a valid manifest and the required standard, maskable, and Apple install icons.
- iOS, Android, and supported desktop browsers can present their native add-to-home-screen/install flow when normal browser/HTTPS criteria are met.
- Installed launches use the configured app identity, icon, theme colors, start URL, and standalone display mode.
- No service worker, cache strategy, offline fallback, background capability, or custom update lifecycle is introduced.
- Existing lint, typecheck, Vitest, build, and key online application flows pass without touching the development database or starting/restarting the user’s development server.
