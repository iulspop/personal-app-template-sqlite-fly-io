# Project Instructions

Act as a top-tier software engineer with serious JavaScript/TypeScript discipline to carefully implement high quality software.

ProjectInstructions {
  BeforeWritingCode {
    Read the lint and formatting rules.
    Observe the project's relevant existing code.
    Conform to existing code style, patterns, and conventions unless directed otherwise. Note: these instructions count as "directed otherwise" unless the user explicitly overrides them.
  }

  Principles {
    DOT, YAGNI, KISS, DRY, TDD.
    SDA - Self Describing APIs.
    Simplicity - "Simplicity is removing the obvious, and adding the meaningful."
      Obvious stuff gets hidden in the abstraction.
      Meaningful stuff is what needs to be customized and passed in as parameters.
      Functions should have default parameters whenever it makes sense so that callers can supply only what is different from the default.
  }
}

## Testing

**TDD is mandatory. No exceptions.** Every change follows Red-Green-Refactor:
1. **Red** — Write a failing test FIRST. Run it. Confirm it fails.
2. **Green** — Write the minimum code to make the test pass. Run it. Confirm it passes.
3. **Refactor** — Clean up while keeping tests green.

Never write implementation code without a failing test already in place. If you catch yourself writing code first, stop, delete it, and write the test.

TestLayers {
  1. **Unit tests** (`*.test.ts`) — Pure domain functions. Colocated with the code under test.
     When: domain logic, transformations, validators, any pure function.
     TDD: Write the test with expected inputs/outputs → create the function → pass the test.

  2. **Render tests** (`*.test.tsx`) — React components. Colocated with the component.
     When: display components, conditional rendering, user interactions, form behavior.
     TDD: Write a render test asserting expected output → create the component → pass the test.

  3. **Integration tests** (`*.spec.ts`) — Infrastructure facades and server actions.
     When: database operations, action handlers, multi-layer interactions.
     TDD: Write a test calling the facade/action with expected DB state → implement → pass.

  4. **E2E tests** (`*.e2e.ts`) — Full user flows via Playwright. Colocated in `e2e/`.
     When: user-facing features, form submissions, navigation, auth flows.
     TDD: Write the Playwright test describing the user journey → build the feature → pass.
}

TestCoverage {
  Every change needs the right COMBINATION of test layers, not just one. Think about what you're changing and cover it at every relevant layer.

  **New feature** (e.g. add user invitation flow):
  - E2E test: new test covering the full user journey (send invite → accept → verify)
  - Unit tests: new tests for domain logic (validation, permission checks, token generation)
  - Integration test: new test for the database facade (save/retrieve invite)
  - Render test: new test for any display component with conditional logic

  **Extend existing feature** (e.g. add role selection to invitation flow):
  - E2E test: extend existing e2e test with the new step, or add a new case
  - Unit tests: new tests for new domain logic (role validation, role-based permissions)
  - Integration test: only if new DB operations were added
  - Render test: only if new component behavior was added

  **Bug fix** (e.g. invitation email not sent for certain roles):
  - E2E test: add a case reproducing the bug, then fix it
  - Unit test: add a case for the edge case in the domain function, then fix it

  **Refactor** (e.g. extract shared validation logic):
  - Existing tests should keep passing. If they don't, fix the code not the tests.
  - Add unit tests for newly extracted functions.
}

TestConstraints {
  Test names follow the pattern: `given: <precondition>, should: <expected behavior>`.
  Use factories (`*-factories.server.ts`) to build test data — never hardcode full objects inline.
  Run e2e tests one at a time: `npx playwright test <path-to-single-test-file>`. Never run the full e2e suite in bulk during development.
  Use Vitest with describe, expect, and test for unit/render/integration tests.
  Capture `actual` and `expected` values in variables before asserting with `toEqual`.
  Avoid `expect.any(Constructor)` in assertions. Expect specific values instead.
}

## JavaScript / TypeScript

Constraints {
  Be concise.
  Favor functional programming; keep functions short, pure, and composable.
  Favor map, filter, reduce over manual loops.
  Prefer immutability; use const, spread, and rest operators instead of mutation.
  One job per function; separate mapping from IO.
  Obey the projects lint and formatting rules.
  Omit needless code and variables; prefer composition with partial application and point-free style.
  Chain operations rather than introducing intermediate variables, e.g. `[x].filter(p).map(f)`
  Avoid loose procedural sequences; compose clear pipelines instead.
  Avoid `class` and `extends` as much as possible. Prefer composition of functions and data structures over inheritance.
  Keep related code together; group by feature, not by technical type.
  Put statements and expressions in positive form.
  Use parallel code for parallel concepts.
  Avoid null/undefined arguments; use options objects instead.
  Use concise syntax: arrow functions, object destructuring, array destructuring, template literals.
  Avoid verbose property assignments. bad: `const a = obj.a;` good: `const { a } = obj;`
  Assign reasonable defaults directly in function signatures.
    `const createExpectedUser = ({ id = createId(), name = '', description = '' } = {}) => ({ id, name, description });`
  Principle: SDA. This means:
    Parameter values should be explicitly named and expressed in function signatures:
      Bad: `const createUser = (payload = {}) => ({`
      Good: `const createUser = ({ id = createId(), name = '', description = ''} = {}) =>`
      Notice how default values also provide hints for type inference.
  Avoid IIFEs. Use block scopes, modules, or normal arrow functions instead. Principle: KISS
  Avoid using || for defaults. Use parameter defaults instead. See above.
  Prefer async/await or asyncPipe over raw promise chains.
  Use strict equality (===).
  Modularize by feature; one concern per file or function; prefer named exports.
}

NamingConstraints {
  Use active voice.
  Use clear, consistent naming.
  Functions should be verbs. e.g. `increment()`, `filter()`.
  Predicates and booleans should read like yes/no questions. e.g. `isActive`, `hasPermission`.
  Prefer standalone verbs over noun.method. e.g. `createUser()` not `User.create()`.
  Avoid noun-heavy and redundant names. e.g. `filter(fn, array)` not `matchingItemsFromArray(fn, array)`.
  Avoid "doSomething" style. e.g. `notify()` not `Notifier.doNotification()`.
  Lifecycle methods: prefer `beforeX` / `afterX` over `willX` / `didX`. e.g. `beforeUpdate()`.
  Use strong negatives over weak ones: `isEmpty(thing)` not `!isDefined(thing)`.
  Mixins and function decorators use `with${Thing}`. e.g. `withUser`, `withFeatures`, `withAuth`.
}

Comments {
  Favor docblocks for public APIs - but keep them minimal.
  Ensure that any comments are necessary and add value. Never reiterate the style guides. Avoid obvious redundancy with the code, but short one-line comments that aid scannability are okay.
  Comments should stand-alone months or years later. Assume that the reader is not familiar with the task plan or epic.
}

## React

Display/container component pattern: split your component into display components (pure functions mapping props to JSX) and container components (optional stateful wrappers). Compose them together in the parent or page/route component.

ReactConstraints {
  Be concise.
  You're using React Router V7 (the successor to Remix).
  Modularize by feature; one concern per file or component; prefer named exports.
  This project uses vanilla-extract for styling, with design tokens under `app/design-system/`. Use tokenized `.css.ts` files instead of utility classes.
}

ReactNaming {
  Use clear, descriptive, consistent naming.
  Components should be postfixed with `Component`.
  Props should be the component's name, postfixed with `ComponentProps`.
}

TypeConstraints {
  Use proper React TypeScript types: MouseEventHandler<HTMLButtonElement>, ChangeEventHandler<HTMLInputElement>, ReactNode, React.Ref<T>, ComponentProps<'element'>, etc. Never use generic () => void or (event: any) => void.
  When extending HTML elements or existing components, use ComponentProps to inherit their props: ComponentProps<'input'>, ComponentProps<'button'>, ComponentProps<typeof ExistingComponent>.
  This project uses Prisma. If a prop comes from a database entity, use the entities type for it, e.g.:
    - type UserMenuProps = Pick<User, 'id' | 'name' | 'email'> & {
        onLogout: MouseEventHandler<HTMLInputElement>;
      }
  When using server/database return types: Awaited<ReturnType<typeof serverFunction>>, wrap with NonNullable<> if guaranteed to exist.
}

## Hexagonal Feature-Slice Architecture

Each feature lives under `app/features/<name>/` with three subdirectories:

```
app/features/<name>/
├── domain/          # Pure types, functions, constants — zero external imports
├── infrastructure/  # Database facades, test factories — Prisma/DB only
└── application/     # Actions, schemas, UI — thin adapters mapping domain to web interface
```

ArchitectureLayers {
  Domain (`domain/`):
    - `*-domain.ts` — Types + pure functions + result types. Zero external imports, pure TS only.
    - `*-domain.test.ts` — Unit tests for pure functions. Imports: Vitest + domain file.
    - `*-constants.ts` — Intent strings, magic values. Zero imports.
  Infrastructure (`infrastructure/`):
    - `*-model.server.ts` — Database facades (single Prisma op each). Imports: Prisma, `~/utils/db.server`.
    - `*-factories.server.ts` — Test data factories. Imports: Faker, cuid2, Prisma types.
  Application (`application/`):
    - `*-action.server.ts` — Thin adapter: map web request to domain + infra calls. Imports: domain, model, schemas, React Router.
    - `*-schemas.ts` — Validate raw form input (structural). Imports: `zod`, constants.
    - `*-page.tsx`, `*.tsx` — Display/container components. Imports: domain (pure helpers), React, RR, i18n.
  Routes (`app/routes/*.tsx`):
    - Thin wiring: loader/action/component. Imports: feature modules.
}

ImportRules {
  Domain files (`*-domain.ts`) must have zero imports.
  Constants files (`*-constants.ts`) must have zero imports.
  Schema files import only from `zod` and `../domain/` constants.
  Model files import only from Prisma and `~/utils/db.server`.
  Action files adapt web requests to domain + infra: `../domain/` + `../infrastructure/` + local schemas.
  UI files can import `../domain/` pure helpers but never model/action files.
}

KeyPatterns {
  One generic `Result<T, E>` replaces per-operation result types.
  SDA function params replace Command objects.
  `ts-pattern` exhaustive matching in action handlers.
  TODO: add a complete reference implementation in `app/features/`.
}

## Facade Functions

FacadeConstraints {
  Apply only to functions in `*-model.server.ts` files.
  Function names must follow `<action><Entity><OptionalWith...><DataSource><OptionalBy...>()` pattern.
  Allowed actions: save | retrieve | update | delete.
  Entity names are singular, in PascalCase.
  Use "With..." to indicate included relations before "From/In/ToDatabase".
  Use "By..." to indicate lookup key(s) last; key names must match schema fields exactly.
  Use "And" to chain multiple included relations or keys.
  Use "ToDatabase" for create, "FromDatabase" for reads, "InDatabase" for updates, "FromDatabase" for deletes.
  Facades must perform a single database operation (no business logic).
  Facades must always return raw Prisma results (no transformations).
  Include JSDoc with description, @param, and @returns tags matching the function name and purpose.
  Prefer explicit Prisma includes/selects; avoid `include: { *: true }`.
  Function bodies must use the `prisma.<entity>.<operation>` pattern directly.
}

## Base UI Components

BaseUiConstraints {
  Components live in `app/components/ui/` and use Base UI primitives when behavior is needed.
  Style components with vanilla-extract `.css.ts` files and tokens from `~/design-system/theme.css`.
  Use `Button`, `Input`, `Textarea`, `FieldError` instead of raw HTML `<button>`, `<input>`, `<textarea>`, `<p role="alert">`.
  Hidden form inputs (`type="hidden"`) stay as plain `<input>` elements.
  Use Tabler icons (`@tabler/icons-react`) instead of inline SVGs.
  Dark mode is system-driven through the global design-system styles.
}
