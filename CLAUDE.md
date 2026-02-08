# Project Instructions

Act as a top-tier software engineer with serious JavaScript/TypeScript discipline to carefully implement high quality software.

## Before Writing Code

- Read the lint and formatting rules.
- Observe the project's relevant existing code.
- Conform to existing code style, patterns, and conventions unless directed otherwise. Note: these instructions count as "directed otherwise" unless the user explicitly overrides them.

## Principles

- DOT
- YAGNI
- KISS
- DRY
- TDD
- SDA - Self Describing APIs
- Simplicity - "Simplicity is removing the obvious, and adding the meaningful."
  - Obvious stuff gets hidden in the abstraction.
  - Meaningful stuff is what needs to be customized and passed in as parameters.
  - Functions should have default parameters whenever it makes sense so that callers can supply only what is different from the default.

## Testing

Develop **test-driven** (TDD): write a failing test first, then the minimal implementation to pass it, then refactor.

- Every new function, component, or behavior must have tests.
- Domain pure functions: unit tests in `*-domain.test.ts` (colocated in `domain/`).
- UI components: render tests in `*.test.tsx` (colocated in `application/`).
- Infrastructure facades: integration tests in `*.spec.ts` when needed.
- Test names follow the pattern: `given: <precondition>, should: <expected behavior>`.
- Use factories (`*-factories.server.ts`) to build test data — never hardcode full objects inline.

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

- Display/container component pattern
  - Split your component into display components, which are pure functions that map props to JSX, and container components, which are (optional) stateful components that wrap one display component.
  - Then compose them together in the parent or page/route component.

ReactConstraints {
  Be concise.
  You're using React Router V7 (the successor to Remix).
  Modularize by feature; one concern per file or component; prefer named exports.
  This project uses TailwindCSS V4, so you can use things like container queries and child selectors.
}

NamingConstraints {
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

InternationalizationConstraints {
  Use useTranslation with namespace and keyPrefix: const { t } = useTranslation('namespace', { keyPrefix: 'section' });
  Use Trans component for interpolation with links/components.
}

## Hexagonal Feature-Slice Architecture

Each feature lives under `app/features/<name>/` with three subdirectories:

```
app/features/<name>/
├── domain/          # Pure types, functions, constants — zero external imports
├── infrastructure/  # Database facades, test factories — Prisma/DB only
└── application/     # Actions, schemas, UI — thin adapters mapping domain to web interface
```

| Layer | Subdirectory | File pattern | Imports allowed | Purpose |
|-------|-------------|-------------|-----------------|---------|
| **Domain** | `domain/` | `*-domain.ts` | Zero external imports. Pure TS only | Types + pure functions + result types |
| **Domain tests** | `domain/` | `*-domain.test.ts` | Vitest + domain file | Unit tests for pure functions |
| **Constants** | `domain/` | `*-constants.ts` | Nothing | Intent strings, magic values |
| **Infrastructure** | `infrastructure/` | `*-model.server.ts` | Prisma, `~/utils/db.server` | Database facades (single Prisma op each) |
| **Factories** | `infrastructure/` | `*-factories.server.ts` | Faker, cuid2, Prisma types | Test data factories |
| **Application** | `application/` | `*-action.server.ts` | Domain, model, schemas, React Router | Thin adapter: map web request to domain + infra calls |
| **Schemas** | `application/` | `*-schemas.ts` | `zod`, constants | Validate raw form input (structural) |
| **UI** | `application/` | `*-page.tsx`, `*.tsx` | Domain (pure helpers), React, RR, i18n | Display/container components |
| **Route** | `app/routes/*.tsx` | N/A | Feature imports | Thin wiring: loader/action/component |

Import rules:
- Domain files (`*-domain.ts`) must have **zero imports**
- Constants files (`*-constants.ts`) must have **zero imports**
- Schema files import only from `zod` and `../domain/` constants
- Model files import only from Prisma and `~/utils/db.server`
- Action files adapt web requests to domain + infra: `../domain/` + `../infrastructure/` + local schemas
- UI files can import `../domain/` pure helpers but never model/action files

Key patterns:
- One generic `Result<T, E>` replaces per-operation result types
- SDA function params replace Command objects
- `ts-pattern` exhaustive matching in action handlers
- See `app/features/todos/` for a complete reference implementation

## Facade Functions

FacadeConstraints {
  - Apply only to functions in `*-model.server.ts` files.
  - Function names must follow `<action><Entity><OptionalWith...><DataSource><OptionalBy...>()` pattern.
  - Allowed actions: save | retrieve | update | delete.
  - Entity names are singular, in PascalCase.
  - Use "With..." to indicate included relations before "From/In/ToDatabase".
  - Use "By..." to indicate lookup key(s) last; key names must match schema fields exactly.
  - Use "And" to chain multiple included relations or keys.
  - Use "ToDatabase" for create, "FromDatabase" for reads, "InDatabase" for updates, "FromDatabase" for deletes.
  - Facades must perform a single database operation (no business logic).
  - Facades must always return raw Prisma results (no transformations).
  - Include JSDoc with description, @param, and @returns tags matching the function name and purpose.
  - Prefer explicit Prisma includes/selects; avoid `include: { *: true }`.
  - Function bodies must use the `prisma.<entity>.<operation>` pattern directly.
}

## shadcn / Base UI Components

- Config: `components.json` (style `base-vega`, icon library `@tabler/icons-react`)
- Components live in `app/components/ui/`, copied from shadcn (not installed via CLI package)
- Use `cn()` from `~/lib/utils` for conditional class merging
- Use semantic color tokens (`text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, etc.) instead of hardcoded Tailwind colors (`text-gray-900`, `bg-blue-600`, etc.)
- Use `Button`, `Input`, `Textarea`, `FieldError` instead of raw HTML `<button>`, `<input>`, `<textarea>`, `<p role="alert">`
- Hidden form inputs (`type="hidden"`) stay as plain `<input>` elements
- Use Tabler icons (`@tabler/icons-react`) instead of inline SVGs
- Dark mode via `className="system"` on `<html>` + `@custom-variant dark` in CSS (OS `prefers-color-scheme`)
