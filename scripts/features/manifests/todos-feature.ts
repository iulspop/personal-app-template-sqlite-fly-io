import { parseFeatureManifest } from "../feature-manifest"

export default parseFeatureManifest({
  capabilities: [],
  checks: ["pnpm exec vitest run app/features/todos"],
  conflicts: [],
  defaultEnabled: true,
  dependencies: [],
  description:
    "Todo management, filtering, and the authenticated home workspace.",
  docs: ["README.md"],
  envKeys: [],
  id: "todos",
  migrations: ["prisma/migrations/20260208200240_add_todo_model"],
  name: "Todos",
  ownedPaths: [
    "app/features/todos",
    "app/routes/index.test.ts",
    "playwright/e2e/todos.e2e.ts",
  ],
  packages: {
    dependencies: [],
    devDependencies: [],
    scripts: [],
  },
  prisma: {
    schemaSlots: ["todosModel"],
  },
  routes: [],
  sourceSlots: [
    { contribution: "todosDocs", slot: "documentation" },
    { contribution: "todosHome", slot: "homeContent" },
    { contribution: "todosHomeAction", slot: "homeContent" },
    { contribution: "todosHomeComponent", slot: "homeContent" },
    { contribution: "todosHomeComponentImports", slot: "homeContent" },
    { contribution: "todosHomeImports", slot: "homeContent" },
    { contribution: "todosLandingData", slot: "homeContent" },
    { contribution: "todosNavigation", slot: "primaryNavigation" },
    { contribution: "todosSeedImports", slot: "testHelpers" },
    { contribution: "todosSeedCleanup", slot: "testHelpers" },
    { contribution: "todosSeedData", slot: "testHelpers" },
    { contribution: "todosE2eHelpers", slot: "testHelpers" },
  ],
})
