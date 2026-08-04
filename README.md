# Personal App Template (SQLite + Fly.io)

A production-ready template for building full-stack personal applications using React Router, SQLite, and Fly.io.

```bash
npx create-react-router@latest --template iulspop/personal-app-template-with-demo
```

## Tech Stack

- [React Router v8](https://reactrouter.com/) with SSR
- [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [vanilla-extract](https://vanilla-extract.style/) design tokens with dark mode
- [Base UI](https://base-ui.com/) primitives + [Tabler Icons](https://tabler.io/icons)
- [SQLite](https://www.sqlite.org/) via [Prisma](https://www.prisma.io/) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Infisical](https://infisical.com/) for configuration and secrets
- [Biome](https://biomejs.dev/) for linting and formatting
- [Vitest](https://vitest.dev/) for unit/integration/component tests
- [Playwright](https://playwright.dev/) for E2E tests
- [Lefthook](https://github.com/evilmartians/lefthook) + [Commitlint](https://commitlint.js.org/) for enforced commit conventions

## Features

- Magic link authentication with [TOTP](https://github.com/epicweb-dev/totp) verification codes
- Transactional emails with [Resend](https://resend.com/) (console fallback in dev)
- Todo CRUD as a reference feature implementation
- Content Security Policy with per-request nonces
- Optional product analytics and session replay with [PostHog](https://posthog.com/)
- Healthcheck endpoint (`/healthcheck`)
- Dark mode (OS `prefers-color-scheme`)
- Minimum installable PWA shell for iOS, Android, and supported desktop browsers
- Accessibility testing with [Axe](https://www.npmjs.com/package/@axe-core/playwright)
- CI/CD with GitHub Actions + auto-deploy to [Fly.io](https://fly.io/)

### Installable PWA shell

The template includes a web app manifest, standard and maskable icons, an Apple touch icon, and mobile install metadata. Configure the installed app identity in `app/config/app-config.ts`. After changing `public/icons/app-icon-source.svg`, regenerate the checked-in PNG assets with:

```bash
pnpm pwa:assets
```

Installation depends on the browser and requires HTTPS in production (`localhost` is accepted for local testing):

- **iOS/iPadOS Safari:** Share menu → **Add to Home Screen**.
- **Android Chromium browsers:** browser menu or native install prompt → **Install app** / **Add to Home screen**.
- **Desktop Chromium browsers:** use the install action in the address bar or browser menu when offered.

Browser wording and install UI vary by platform and version. This template intentionally has **no service worker, offline mode, Cache Storage strategy, update lifecycle, push notifications, background sync, offline mutation queue, or app-store packaging**. Installed launches use normal network behavior, just like the website.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 11+
- [Infisical CLI](https://infisical.com/docs/cli/overview)

### Infisical configuration

This template uses Infisical as the only source for app configuration and secrets. Do not create local `.env` files.

Create these secrets/config values in Infisical:

| Environment | Path |
|-------------|------|
| `dev` | `/web` |
| `staging` | `/web` |
| `prod` | `/web` |

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./prisma/dev.db` locally, `file:/data/sqlite.db` on Fly |
| `SESSION_SECRET` | Cookie signing secret | Generate a long random value |
| `RESEND_API_KEY` | [Resend](https://resend.com/) API key for emails | `re_...` |
| `EMAIL_FROM` | Sender address for emails | `noreply@example.com` |
| `APP_URL` | Public application URL for magic links | `http://localhost:5250` or Fly URL |
| `ALLOW_INDEXING` | Allow search engine indexing (`true`/`false`) | `false` for staging |
| `POSTHOG_API_KEY` | Optional PostHog project key; enables analytics and production session replay | `phc_...` |
| `POSTHOG_API_HOST` | Optional PostHog API host | `https://us.i.posthog.com` |
| `SENTRY_DSN` | Optional public Sentry DSN; enables client/server errors and tracing | `https://...@...ingest.sentry.io/...` |
| `SENTRY_ENVIRONMENT` | Optional Sentry environment name | `development`, `staging`, or `production` |
| `SENTRY_TRACES_SAMPLE_RATE` | Optional trace sample rate from `0` to `1` | `0.1` |
| `SENTRY_RELEASE` | Optional release identifier shared by runtime events and source maps | Git commit SHA or app version |
| `SENTRY_AUTH_TOKEN` | Optional build-only token for source map uploads | Stored in Infisical |
| `SENTRY_ORG` | Sentry organization slug required for source map uploads | `your-org` |
| `SENTRY_PROJECT` | Sentry project slug required for source map uploads | `your-project` |
| `FLY_API_TOKEN` | Fly deploy token for CI deploys | Stored in Infisical `prod` `/web` |
| `OWNER_EMAIL_ALLOWLIST` | Comma-separated verified emails allowed to claim the sole owner seat | `owner@example.com` |
| `OWNER_PHONE_NUMBER` | Optional owner SMS notification destination | E.164 number such as `+15551234567` |
| `TWILIO_ACCOUNT_SID` | Optional Twilio account identifier | `AC...` |
| `TWILIO_AUTH_TOKEN` | Optional Twilio API credential | Keep secret |
| `TWILIO_FROM_NUMBER` | Optional Twilio sender number | E.164 number |

Twilio is optional. If any SMS value is missing, chat and email notifications continue normally and no SMS delivery is attempted.

### Observability

PostHog and Sentry are integrated but remain disabled when their project configuration is absent:

- PostHog captures page views whenever `POSTHOG_API_KEY` is configured and enables session replay only in production.
- Sentry captures browser and server errors plus React Router page-load, navigation, loader, action, and middleware traces whenever `SENTRY_DSN` is configured.
- Production source maps upload only when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are all configured. The uploaded maps are removed from the build output afterward.
- `SENTRY_DSN` is intentionally exposed to the browser; keep `SENTRY_AUTH_TOKEN` server/build-only.

The repo still defensively ignores `.env*` files so secrets are not accidentally committed.

### Installation

```bash
pnpm install
```

### Quick Start

Run secret-dependent commands through Infisical:

```bash
pnpm secrets:dev pnpm prisma migrate dev
pnpm secrets:dev pnpm db:seed
pnpm dev:secrets
```

Your application will be available at `http://localhost:5250`.

### Demo Accounts

After seeding, you can log in with any of these emails (a TOTP code is logged to the console):

- `alice@example.com`
- `bob@example.com`
- `charlie@example.com`

## Architecture

This template follows a **hexagonal feature-slice architecture**. Each feature lives under `app/features/<name>/` with three layers:

```
app/features/<name>/
  domain/          # Pure types, functions, constants -- zero external imports
  infrastructure/  # Database facades, test factories -- Prisma only
  application/     # Actions, schemas, UI -- thin adapters mapping domain to web
```

**Import rules:**
- Domain files have zero imports (pure TypeScript only)
- Infrastructure imports only Prisma
- Application imports domain + infrastructure
- UI imports domain pure helpers but never model/action files

The `app/features/todos/` directory is a complete reference implementation of this pattern.

## Product UI system

The interface uses a light-first, density-conscious product system built with Vanilla Extract.

- Use the semantic tokens in `app/design-system/tokens/`; do not introduce page-local color or typography scales.
- Keep typography to the page title, section title, body/control, supporting, and metadata roles. Monospace is reserved for technical values.
- Prefer flat rows, dividers, and whitespace over nested cards. Controls use compact desktop sizing and mobile-friendly targets.
- Use Tabler outline icons at 16px in controls and 18px in primary navigation. Decorative icons must be hidden from assistive technology.
- Use the shared light/dark themes, short motion tokens, visible focus states, and reduced-motion behavior.
- Authenticated pages belong in `AppShell`; mobile navigation uses the single top menu rather than a second fixed navigation bar.

## Development

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev:secrets` | Start dev server with Infisical `dev` `/web` config |
| `pnpm build:secrets` | Production build with Infisical `dev` `/web` config |
| `pnpm start` | Start production server |
| `pnpm check` | Auto-fix lint/format issues (Biome) |
| `pnpm lint` | Check for lint/format errors without fixing (CI) |
| `pnpm pwa:assets` | Regenerate checked-in PWA install icons from the source SVG |
| `pnpm typecheck:secrets` | Generate route types + TypeScript type check with Infisical config |
| `pnpm test:secrets` | Run Vitest tests once with Infisical config |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:e2e:secrets` | Run Playwright E2E tests with Infisical config |
| `pnpm test:e2e:ui` | Run Playwright with interactive UI |
| `pnpm test:pwa` | Build and verify the minimum install shell on an isolated production server |
| `pnpm secrets:dev <command>` | Run any command with Infisical `dev` `/web` config |
| `pnpm secrets:staging <command>` | Run any command with Infisical `staging` `/web` config |
| `pnpm secrets:prod <command>` | Run any command with Infisical `prod` `/web` config |

When enabled, CI jobs load Infisical secrets through GitHub OIDC before running the standard `pnpm lint`, `pnpm typecheck`, `pnpm test`, and build commands.

### Database Scripts

| Script | Description |
|--------|-------------|
| `pnpm db:migrate:secrets -- <name>` | Create a new Prisma migration with Infisical config |
| `pnpm db:push:secrets` | Push schema to DB without a migration with Infisical config |
| `pnpm db:reset:secrets` | Wipe DB, re-run migrations, push schema, and re-seed with Infisical config |
| `pnpm db:seed:secrets` | Seed database with demo data with Infisical config |
| `pnpm db:studio:secrets` | Open Prisma Studio GUI with Infisical config |
| `pnpm db:migrate:prod:secrets` | Run production migrations with Infisical `prod` `/web` config |

### Owner live chat operations

The demo includes one private conversation per regular user and one globally claimed owner seat. An eligible, verified user claims the seat at `/owner/claim`; the allowlist is normalized and enforced server-side. The owner uses `/owner/chats`, while regular users use `/chat`.

- Attachments are private and stored outside the public web root at `/data/chat-attachments` in production. Back up both the SQLite database and Fly volume. Allowed files are PNG, JPEG, WebP, and PDF, with a 10 MB per-file limit.
- Resend email and Twilio SMS notifications are best-effort. A failed provider call never rolls back a persisted message. External notifications are suppressed during a five-minute unread-conversation cooldown to avoid duplicate alerts.
- Same-origin SSE provides near-real-time updates by polling SQLite. Presence means a visible or recently active authenticated browser tab; it does not imply background device availability.
- The deployment assumes one Fly machine and fewer than 1,000 users. Before adding replicas, move attachments to shared object storage and replace local SQLite polling with multi-instance realtime fan-out.
- Before production rollout, back up the database and volume, run `pnpm db:migrate:prod:secrets` manually over Fly SSH, then deploy. Do not run Prisma migrations from the Docker command or Fly release command.
- Use non-delivering Twilio/Resend test credentials or mocks in CI. Never store real provider credentials or phone numbers in the repository.

### Security

**Content Security Policy (CSP):**
- Report-only mode in development and test
- Enforced in production
- All inline scripts require a valid nonce

**ALLOW_INDEXING:**
- Set to `"false"` on staging/preview to prevent search engine indexing
- Adds both `X-Robots-Tag` header and `<meta name="robots">` tag

### Testing

Tests are organized in three tiers:

1. **Unit tests** (`*.test.ts`) -- pure domain functions, colocated in `domain/`
2. **Component tests** (`*.test.tsx`) -- React rendering tests via Testing Library + happy-dom
3. **Integration tests** (`*.spec.ts`) -- database facade tests against real SQLite
4. **E2E tests** (`playwright/e2e/*.e2e.ts`) -- full browser tests with Playwright

Vitest recreates `prisma/test.db`, while Playwright recreates `prisma/e2e.db` and starts its own server on port `5251`. Neither suite reads or modifies the development database at `prisma/dev.db`.

Test names follow: `given: <precondition>, should: <expected behavior>`.

Run the full suite locally with Infisical:

```bash
pnpm test:secrets && pnpm test:e2e:secrets
```

### Linting and Formatting

This project uses [Biome](https://biomejs.dev/) (configured in `biome.json`). Install the [Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) for auto-formatting on save.

```bash
pnpm check   # auto-fix
pnpm lint     # check only (CI)
```

### Git Hooks (Lefthook)

- **Pre-commit:** `biome check --write --staged` + `pnpm typecheck`
- **Commit-msg:** Commitlint (conventional commits with required scope)

## Building for Production

```bash
pnpm build:secrets
```

## Deployment

### Fly.io (Default)

This template is configured for Fly.io with a persistent SQLite volume.

**First deploy:**

```bash
./scripts/deploy.sh
```

The deploy script is idempotent: it creates the app and volume if they don't exist, imports production `/web` secrets from Infisical into Fly, and deploys.

**GitHub Actions deploys** use the official Infisical action with OIDC. Configure these non-secret repository variables:

```bash
gh variable set INFISICAL_IDENTITY_ID --body <identity-id>
gh variable set INFISICAL_PROJECT_SLUG --body <project-slug>
```

Store the Fly deploy token in Infisical `prod` `/web` as `FLY_API_TOKEN`:

```bash
flyctl tokens create deploy --app personal-app-template-sqlite-fly-io
```

### CI/CD

CI and pull-request checks are skipped by default. To enable all automatic checks, set the repository variable `RUN_CI` to `true`. You can also run either workflow manually with its `run_checks` input enabled.

When enabled, the pull-request workflow runs commitlint, Biome, TypeScript, Vitest with coverage, and Playwright Chrome. The CI workflow runs Biome, TypeScript, Vitest with coverage, and Playwright Chrome on pushes to `main` and `dev`.

The deploy workflow can always be run manually. Automatic deployment after a successful `main` CI run only occurs when `RUN_CI` is `true`.

### Docker

To build and run locally:

```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```

The multi-stage Dockerfile uses Node 22 Alpine with pnpm and can be deployed to any Docker-compatible platform. On Fly.io, run production migrations manually on the app machine after deploy so the mounted `/data` SQLite volume is available:

```bash
flyctl ssh console --app personal-app-template-sqlite-fly-io -C "sh -lc 'cd /app && pnpm db:migrate:prod'"
```

## AI-Driven Development

This template leverages **AI-Driven Development (AIDD)**, where you steer high-level design and let AI generate the bulk of your implementation via [**SudoLang**](https://github.com/paralleldrive/sudolang-llm-support), a natural-language-style pseudocode that advanced LLMs already understand.

### Claude Code Skills

Under `.claude/commands/`, you'll find ready-to-use slash commands:

- **/better-writer** - Improves writing clarity and engagement using Scott Adams' rules.
- **/brainstorm** - Helps ideate solutions with clear trade-offs and recommendations.
- **/commit** - Commits changes using conventional commit format.
- **/debug** - Provides systematic debugging with root cause analysis.
- **/documentation** - Creates clear, example-first documentation.
- **/log** - Logs completed epics to CHANGELOG.md with emoji system.
- **/name** - Suggests clear, descriptive names for functions and variables.
- **/plan** - Breaks down complex requests into manageable, sequential tasks.
- **/svg-to-react** - Converts SVG files into optimized React components.
- **/unit-tests** - Generates thorough, readable unit tests using Vitest.
- **/write** - Produces clear, concise business writing with specific style guidelines.

Learn more about AIDD and SudoLang in [The Art of Effortless Programming](https://leanpub.com/effortless-programming) by [Eric Elliott](https://www.threads.com/@__ericelliott).

## Maintenance

Check for dependency updates:

```bash
npx npm-check-updates -u
```

Static analysis and tests will catch breakages from upgrades.
