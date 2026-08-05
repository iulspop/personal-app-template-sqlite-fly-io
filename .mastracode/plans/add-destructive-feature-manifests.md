# Add Extensible Quickstart Feature Manifests

## Overview

Extend `pnpm setup` with a manifest system that discovers optional feature slices and permanently removes unselected features from a fresh template. Register `todos` and `founderChat` initially, while ensuring future slices—such as a later AI chat feature—work in any valid combination without adding feature IDs or combination-specific branches to setup tooling.

## Complexity estimate

- **Size**: Large (setup tooling, composition seams, manifests, Prisma handling, doctor/architecture checks, tests, and docs)
- **Risk**: High (destructive source and migration removal across independently selectable features)
- **Dependencies**: No new runtime packages; reuse the existing TypeScript/Zod/tooling stack. No external services or production migrations are required.

## Architecture decisions

- Feature selection is a destructive setup-time source transformation, not runtime flags.
- Authentication, users, settings, PWA metadata, observability, design system, and starter tooling remain mandatory core.
- Manifests are data-driven and discovered from `scripts/features/manifests/`.
- Manifests declare capabilities, dependencies, conflicts, owned files, routes, composition contributions, database fragments, migrations, environment keys, package dependencies, docs, and verification commands.
- Shared capabilities use reference counting. Example: Redux packages/store composition remain when either `founderChat` or a future workflow feature needs them.
- Every valid combination is derived from discovered manifests instead of maintained as a fixed matrix.
- Adding a future feature requires its feature slice and one declarative manifest; the setup planner, CLI, doctor, and verification harness must not need feature-specific branches.

## Safety constraints

- `--dry-run` lists all deletions, generated files, source edits, package changes, schema changes, and migration changes without mutation.
- Interactive setup shows the plan and requires confirmation.
- Non-interactive setup requires an explicit feature selection object.
- Refuse destructive feature removal when tracked files have unrelated changes unless `--force-feature-removal` is supplied.
- Refuse schema/migration removal when a non-empty development database exists unless forced; never delete a database automatically.
- Apply transformations atomically only after all preflight checks pass.
- Never mutate Infisical secrets, print secret values, deploy, or start/restart the development server.
- Automated verification uses temporary project copies and isolated SQLite databases; `prisma/dev.db` must remain unchanged.

## Implementation tasks

1. **Define open manifest contracts**
   - Add `scripts/features/feature-manifest.ts` with string feature IDs and Zod validation.
   - Model dependencies, conflicts, capabilities, owned paths, source slots, package dependencies, Prisma fragments, migration paths, env keys, docs, and checks.
   - Add contract tests for malformed and duplicate declarations.

2. **Discover manifests without a closed registry**
   - Add `scripts/features/load-feature-manifests.ts` to load `scripts/features/manifests/*-feature.ts` in stable order.
   - Validate unique IDs, unique owned paths, resolvable dependencies, no dependency cycles, and known composition slots.
   - Add temporary-fixture discovery/cycle tests.

3. **Extend setup configuration for arbitrary feature IDs**
   - Change setup config to accept `features: Record<string, boolean>` validated against discovered manifests.
   - Interactive setup lists each manifest’s name, description, default, dependencies, and conflicts.
   - Non-interactive setup rejects missing selections and unknown feature IDs.

4. **Create reusable composition slots**
   - Add generated composition modules for primary navigation, authenticated providers, settings links, home content, root loader extensions, server env extensions, and Redux reducers/sagas.
   - Refactor core shell/root/settings/index to import only generated composition modules.
   - Add core-only render/route tests before feature deletion is implemented.

5. **Extract shared client-workflow capability**
   - Refactor `app/store` so feature reducers/sagas are supplied through generated composition rather than hardcoded founder-chat imports.
   - Declare shared packages (`redux`, `react-redux`, `redux-saga`) as the `clientWorkflows` capability.
   - Keep the capability only while at least one retained manifest requires it.

6. **Create current-feature manifests**
   - Add `todos-feature.ts` and `founder-chat-feature.ts` under `scripts/features/manifests/`.
   - Fully inventory each slice’s feature directory, routes, tests, E2E files/sections, Prisma models/relations, migrations, env keys, package dependencies, docs, and composition contributions.
   - Add inventory tests that fail when declared paths or source slots drift.

7. **Create exact source-slot transformations**
   - Add explicit begin/end markers at schema, env, docs, and composition extension points.
   - Implement `source-slots.ts` with exact-one-match replacement/removal; reject stale or duplicate markers.
   - Do not use broad regex deletion.

8. **Plan removals and retained capabilities**
   - Add `plan-feature-selection.ts` to resolve dependencies/conflicts, compute retained capabilities, and produce deterministic deletions/edits/dependency changes.
   - Detect retained imports of removed paths and undeclared cross-feature dependencies.
   - Add plan tests for every valid combination of the two initial features plus fixture-manifest tests proving a newly discovered third feature is handled without planner changes.

9. **Apply feature selection atomically**
   - Add `apply-feature-selection.ts` to stage all output in memory, validate it, and then write/delete.
   - Update `package.json` dependencies/scripts from retained capability usage.
   - Add fixture tests proving failed preflight leaves all files unchanged.

10. **Handle Prisma history for fresh quickstarts**
    - Move feature-owned Prisma schema sections behind exact slots.
    - Delete only manifest-owned migration directories for removed features.
    - Validate retained migration chains by deploying to fresh temporary SQLite databases.
    - Keep the existing-database guard and explicit force override.

11. **Integrate manifests into `pnpm setup`**
    - Include discovered feature choices in prompts, config files, preview, confirmation, dry run, and final summary.
    - Add `--force-feature-removal` parsing.
    - Apply identity/icon updates and feature selection as one setup transaction.

12. **Extend doctor and architecture checks**
    - Report discovered/retained features, dependency resolution, partial removals, orphan imports, stale source slots, schema drift, and missing required configuration.
    - Enforce that optional feature code cannot import another optional feature unless its manifest declares the dependency.
    - Validate manifest ownership and generated composition boundaries without hardcoded feature names.

13. **Prove future-feature extensibility with fixtures**
    - Add a temporary third-feature fixture used only by tooling tests; it must declare its own route, package, source-slot contribution, schema fragment, migration, environment key, and optional shared capability.
    - Verify discovery, prompts/config validation, dependency resolution, dry-run planning, removal, retained capabilities, doctor, and architecture checks handle the fixture without production-code branches for its ID.
    - Keep AI chat strictly as a documented example of what could later use this contract; do not add AI chat application code or dependencies now.

14. **Verify all manifest-derived combinations**
    - Add `pnpm test:features` to copy the repository into temporary directories and exercise every valid combination derived from the production manifests.
    - For each combination run setup non-interactively, deploy migrations to a temporary DB, generate Prisma, run architecture checks, typecheck, relevant tests, and build.
    - Assert removed feature imports, routes, packages, schema models, environment surface, and docs are absent.
    - Separately run fixture combinations to prove the harness scales when another manifest is discovered.

15. **Document the extension workflow**
    - Document how a future feature—such as AI chat—adds its slice and one manifest without modifying setup/planner code.
    - Document dependencies, conflicts, shared capabilities, source slots, destructive setup semantics, dry run, force guard, and Git recovery.
    - Add representative setup configs for full, Todo-only, founder-chat-only, and core-only selections; explain that future manifests automatically add choices.

16. **Run final verification**
    - Run focused TDD checks throughout.
    - Run `pnpm test:features`, architecture checks, doctor, lint, typecheck, full isolated Vitest, build, focused PWA test, focused founder-chat E2E, and `git diff --check`.
    - Confirm `prisma/dev.db` is unchanged and no user development server was started/restarted.

## Out of scope

- Runtime or tenant-specific feature flags.
- Re-enabling removed code without Git or a fresh template clone.
- Third-party manifests executing arbitrary code.
- Disabling mandatory core auth/users/settings/tooling.
- Implementing AI chat or adding OpenAI/other AI dependencies, routes, models, configuration, or UI.
- Secret mutation, deployment, or automatic database deletion.
