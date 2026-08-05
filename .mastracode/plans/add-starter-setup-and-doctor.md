# Add Starter Configuration, Setup, and Doctor Tooling

## Overview

Turn the existing template conventions into enforceable contracts and safe starter tooling. Add a typed server environment boundary, architecture import checks, a conservative `pnpm setup` initializer, and a read-only `pnpm app:doctor` command. Preserve existing runtime behavior, Infisical-only secret management, database isolation, minimum PWA scope, and all demo features.

Real-device PWA installation and production integration smoke tests remain a manual deployment checkpoint because local automation cannot prove native iOS, Android, or desktop browser installation UI.

## Scope

- Central typed parsing for server configuration and optional integrations.
- No secret values exposed in errors, reports, logs, or generated files.
- Automated feature-layer import-boundary checks.
- Setup v1 for app identity, production URL guidance, and icon generation.
- Doctor v1 for identity, PWA assets, environment readiness, database isolation, architecture, Prisma, and integration configuration.
- Human-readable and JSON doctor output with automation-friendly exit codes.
- No demo-feature deletion, service worker, offline behavior, deployment, secret mutation, or development-server startup.

## Tasks

1. **Define the server environment schema**
   - **Files**: `app/config/server-env.ts`, `app/config/server-env.test.ts`
   - Add Zod schemas for runtime mode, database/app URLs, auth/email, owner chat, Twilio, PostHog, Sentry, indexing, and attachment configuration.
   - Separate required production fields from optional integration fields and expose redacted validation issues only.

2. **Expose lazy typed environment access**
   - **Files**: `app/config/server-env.server.ts`, `app/config/server-env.server.test.ts`
   - Add cached `getServerEnv()` and explicit `parseServerEnv(source, mode)` APIs so tests/build tooling can validate custom sources without eagerly failing module import.
   - Keep safe development defaults only where current behavior already depends on them.

3. **Migrate core runtime configuration consumers**
   - **Files**: `app/root.tsx`, `app/entry.server.tsx`, `app/utils/db.server.ts`, `app/features/auth/application/auth-session.server.ts`
   - Replace direct access for shared runtime mode, indexing, database URL, public observability values, and session configuration with the typed boundary.
   - Preserve browser-safe `window.ENV` fields and existing defaults.

4. **Migrate auth and notification configuration consumers**
   - **Files**: auth email/action files, chat infrastructure files, owner/settings/chat routes
   - Replace remaining application runtime `process.env` reads with typed values passed at route/infrastructure boundaries.
   - Keep provider integrations optional and preserve notification failure semantics.

5. **Add architecture-boundary analysis**
   - **Files**: `scripts/check-architecture.ts`, `scripts/check-architecture.test.ts`
   - Scan feature imports and enforce documented rules: domain cannot import application/infrastructure/frameworks; infrastructure cannot import application; presentation/UI cannot import server model/action files.
   - Emit file, import, violated rule, and remediation without introducing a new dependency.

6. **Wire architecture checks into project commands**
   - **Files**: `package.json`, `README.md`
   - Add `pnpm check:architecture` and include it in the documented verification workflow.
   - Do not enable skipped CI automatically; the command runs when checks are explicitly enabled or invoked locally.

7. **Define setup input and transformation contracts**
   - **Files**: `scripts/setup/setup-config.ts`, `scripts/setup/setup-config.test.ts`
   - Define validated setup input for app name, short name, description, locale, production URL, and icon source.
   - Support interactive answers and a JSON config file with identical validation.

8. **Implement deterministic app-config updates**
   - **Files**: `scripts/setup/update-app-config.ts`, tests
   - Update only the canonical values in `app/config/app-config.ts` using a generated-file-safe template or exact structured markers.
   - Reject ambiguous files instead of repository-wide search-and-replace.

9. **Implement the setup command**
   - **Files**: `scripts/setup.ts`, `package.json`
   - Add `pnpm setup`, `--dry-run`, `--config`, and `--non-interactive` modes.
   - Preview changes, require confirmation for interactive writes, regenerate PWA assets, format changed files, and output a manual Infisical checklist without writing secrets or starting servers.

10. **Define doctor result contracts**
    - **Files**: `scripts/doctor/doctor-types.ts`, `scripts/doctor/doctor-types.test.ts`
    - Model pass/warn/fail findings, categories, remediation, readiness summary, and stable JSON output.
    - Define exit code `0` for ready and `1` for blocking failures; make `--strict` promote warnings to failure.

11. **Implement static doctor checks**
    - **Files**: `scripts/doctor/check-app.ts`, `check-pwa.ts`, `check-databases.ts`, tests
    - Detect placeholder identity, invalid/missing icons, app-config inconsistencies, service workers/caches, and overlapping dev/test/E2E database paths.
    - Verify generated icon dimensions and source/output freshness without mutating files.

12. **Implement environment and integration doctor checks**
    - **Files**: `scripts/doctor/check-env.ts`, `check-integrations.ts`, tests
    - Reuse the typed environment parser and report required/optional readiness for auth, Resend, owner chat, Twilio, PostHog, and Sentry.
    - Report names/status only; never report secret values.

13. **Implement Prisma and architecture doctor checks**
    - **Files**: `scripts/doctor/check-prisma.ts`, `check-architecture.ts`, tests
    - Reuse architecture analysis and inspect Prisma migration/schema readiness with non-destructive commands.
    - Do not create, migrate, reset, or connect to production data automatically.

14. **Implement the doctor CLI**
    - **Files**: `scripts/app-doctor.ts`, `package.json`
    - Add `pnpm app:doctor`, `--json`, `--strict`, and `--production` modes.
    - Keep default execution read-only and avoid network-delivering active checks in v1.

15. **Document starter workflow and manual PWA checkpoint**
    - **Files**: `README.md`
    - Document `setup`, `app:doctor`, architecture checks, safe secret handling, dry-run/JSON examples, and expected exit behavior.
    - Include the outstanding manual iOS Safari, Android Chrome, desktop Chromium, and online integration smoke-test checklist.

16. **Verify the complete starter tooling**
    - Run setup unit tests against temporary fixture copies, including dry-run idempotency and invalid-input rejection.
    - Run doctor tests for success, warning, failure, redaction, JSON, strict, and production modes.
    - Run `pnpm check:architecture`, `pnpm app:doctor`, `pnpm lint`, `pnpm typecheck`, isolated Vitest, `pnpm build`, `pnpm test:pwa`, and `git diff --check`.
    - Confirm `prisma/dev.db` is unchanged and no development server is started or restarted.

## Completion Criteria

- Runtime configuration is parsed through one typed, redacted server boundary.
- Architecture rules documented in README are automatically enforceable.
- `pnpm setup` safely configures identity and PWA assets with preview and deterministic output.
- `pnpm app:doctor` is read-only, redacts secrets, supports human/JSON output, and reports actionable readiness.
- Existing auth, passkeys, Todos, founder chat, observability, database isolation, deployment, and minimum no-offline PWA behavior remain intact.
- Native install flows and production integrations have a clear manual verification checklist but are not falsely reported as automated.