# Personal App Template (SQLite + Fly.io)

A production-ready template for building full-stack personal applications using React Router, SQLite, and Fly.io.

```bash
npx create-react-router@latest --template iulspop/personal-app-template-sqlite-fly-io
```

## Tech Stack

- [React Router v7](https://reactrouter.com/) (successor to Remix) with SSR
- [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [TailwindCSS v4](https://tailwindcss.com/) with dark mode
- [shadcn/Base UI](https://ui.shadcn.com/) components + [Tabler Icons](https://tabler.io/icons)
- [SQLite](https://www.sqlite.org/) via [Prisma](https://www.prisma.io/) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Biome](https://biomejs.dev/) for linting and formatting
- [Vitest](https://vitest.dev/) for unit/integration/component tests
- [Playwright](https://playwright.dev/) for E2E tests
- [Lefthook](https://github.com/evilmartians/lefthook) + [Commitlint](https://commitlint.js.org/) for enforced commit conventions

## Features

- Magic link authentication with [TOTP](https://github.com/epicweb-dev/totp) verification codes
- Transactional emails with [Resend](https://resend.com/) (console fallback in dev)
- Todo CRUD as a reference feature implementation
- Content Security Policy with per-request nonces
- Healthcheck endpoint (`/healthcheck`)
- Internationalization with [i18next](https://www.i18next.com/) + [remix-i18next](https://github.com/sergiodxa/remix-i18next)
- Dark mode (OS `prefers-color-scheme`)
- Accessibility testing with [Axe](https://www.npmjs.com/package/@axe-core/playwright)
- CI/CD with GitHub Actions + auto-deploy to [Fly.io](https://fly.io/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+

### Installation

```bash
pnpm install
```

### Quick Start

Copy the example environment file and set up the database:

```bash
cp .env.example .env
pnpm prisma migrate dev
pnpm db:seed
```

Start the development server:

```bash
pnpm dev
```

Your application will be available at `http://localhost:5173`.

### Demo Accounts

After seeding, you can log in with any of these emails (a TOTP code is logged to the console):

- `alice@example.com`
- `bob@example.com`
- `charlie@example.com`

### Environment Variables

Create a `.env` file from the example:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./prisma/dev.db` |
| `SESSION_SECRET` | Cookie signing secret | `super-duper-s3cret` |
| `RESEND_API_KEY` | [Resend](https://resend.com/) API key for emails | (empty, falls back to console) |
| `EMAIL_FROM` | Sender address for emails | `noreply@example.com` |
| `ALLOW_INDEXING` | Allow search engine indexing (`true`/`false`) | `true` |

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

## Development

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Production build (Prisma generate + React Router build) |
| `pnpm start` | Start production server |
| `pnpm check` | Auto-fix lint/format issues (Biome) |
| `pnpm lint` | Check for lint/format errors without fixing (CI) |
| `pnpm typecheck` | Generate route types + TypeScript type check |
| `pnpm test` | Run Vitest tests once |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm test:e2e:ui` | Run Playwright with interactive UI |

### Database Scripts

| Script | Description |
|--------|-------------|
| `pnpm db:migrate -- <name>` | Create a new Prisma migration |
| `pnpm db:push` | Push schema to DB without a migration |
| `pnpm db:reset` | Wipe DB, re-run migrations, push schema, and re-seed |
| `pnpm db:seed` | Seed database with demo data |
| `pnpm db:studio` | Open Prisma Studio GUI |

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

Test names follow: `given: <precondition>, should: <expected behavior>`.

Run the full suite:

```bash
pnpm test && pnpm test:e2e
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
pnpm build
```

## Deployment

### Fly.io (Default)

This template is configured for Fly.io with a persistent SQLite volume.

**First deploy:**

```bash
# Set your secrets and deploy
SESSION_SECRET=xxx RESEND_API_KEY=re_xxx EMAIL_FROM=you@example.com ./scripts/deploy.sh
```

The deploy script is idempotent -- it creates the app and volume if they don't exist, stages secrets, and deploys.

**After the first deploy**, generate a deploy token for CI/CD:

```bash
flyctl tokens create deploy --app personal-app-template-sqlite-fly-io
```

Add `FLY_API_TOKEN` to your GitHub repository secrets.

### CI/CD

**Pull Request workflow** (`.github/workflows/ci.yml`) runs on all PRs and pushes to `main`/`dev`:

1. Biome lint
2. TypeScript type check
3. Commitlint
4. Vitest (unit + integration + component with coverage)
5. Playwright Chrome (E2E)

**Deploy workflow** (`.github/workflows/deploy.yml`) auto-deploys to Fly.io when CI passes on `main`.

### Docker

To build and run locally:

```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```

The multi-stage Dockerfile uses Node 20 Alpine with pnpm, runs `prisma migrate deploy` on startup, and can be deployed to any Docker-compatible platform.

## AI-Driven Development

This template leverages **AI-Driven Development (AIDD)**, where you steer high-level design and let AI generate the bulk of your implementation via [**SudoLang**](https://github.com/paralleldrive/sudolang-llm-support), a natural-language-style pseudocode that advanced LLMs already understand.

### CLAUDE.md

Project-level coding standards loaded automatically every Claude Code session. Consolidates JavaScript/TypeScript principles (DOT, YAGNI, KISS, DRY, SDA), functional programming constraints, React/React Router V7 patterns, component naming, TypeScript type guidance (including Prisma types), i18n conventions, and facade function naming for `*-model.server.ts` files.

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
