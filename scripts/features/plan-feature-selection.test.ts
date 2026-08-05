import { describe, expect, test } from "vitest"

import type { FeatureManifest } from "./feature-manifest"
import { planFeatureSelection } from "./plan-feature-selection"

const createManifest = ({
  capabilities = [],
  dependencies = [],
  id,
  packages = [],
  scripts = [],
}: {
  capabilities?: string[]
  dependencies?: string[]
  id: string
  packages?: string[]
  scripts?: string[]
}): FeatureManifest => ({
  capabilities,
  checks: [`check:${id}`],
  conflicts: [],
  defaultEnabled: true,
  dependencies,
  description: `${id} description`,
  docs: [`docs/${id}.md`],
  envKeys: [`${id.toUpperCase()}_KEY`],
  id,
  migrations: [`prisma/migrations/${id}`],
  name: id,
  ownedPaths: [`app/features/${id}`],
  packages: { dependencies: packages, devDependencies: [], scripts },
  prisma: { schemaSlots: [id] },
  routes: [`app/routes/${id}.tsx`],
  sourceSlots: [{ contribution: `${id}Home`, slot: "homeContent" }],
})

const manifests = [
  createManifest({ id: "todos" }),
  createManifest({
    capabilities: ["clientWorkflows"],
    id: "founderChat",
    packages: ["redux"],
  }),
]

describe("planFeatureSelection", () => {
  test.each([
    [{ founderChat: true, todos: true }, [], ["founderChat", "todos"]],
    [{ founderChat: false, todos: true }, ["founderChat"], ["todos"]],
    [{ founderChat: true, todos: false }, ["todos"], ["founderChat"]],
    [{ founderChat: false, todos: false }, ["founderChat", "todos"], []],
  ])(
    "given: a valid production feature combination, should: derive a deterministic plan",
    (features, removedFeatureIds, retainedFeatureIds) => {
      const actual = planFeatureSelection({ features, manifests })

      expect(actual.removedFeatureIds).toEqual(removedFeatureIds)
      expect(actual.retainedFeatureIds).toEqual(retainedFeatureIds)
      expect(actual.deletions).toEqual([...actual.deletions].sort())
    },
  )

  test("given: the final workflow feature is removed, should: remove its shared capability and package", () => {
    const expected = {
      removedCapabilities: ["clientWorkflows"],
      removedDependencies: ["redux"],
      removedScripts: ["workflow:check"],
    }

    const workflowManifests = manifests.map((manifest) =>
      manifest.id === "founderChat"
        ? {
            ...manifest,
            packages: { ...manifest.packages, scripts: ["workflow:check"] },
          }
        : manifest,
    )
    const workflowActual = planFeatureSelection({
      features: { founderChat: false, todos: true },
      manifests: workflowManifests,
    })

    expect({
      removedCapabilities: workflowActual.removedCapabilities,
      removedDependencies: workflowActual.packageChanges.dependencies.remove,
      removedScripts: workflowActual.packageChanges.scripts.remove,
    }).toEqual(expected)
  })

  test("given: another discovered feature retains a capability, should: retain shared packages without planner changes", () => {
    const futureFeature = createManifest({
      capabilities: ["clientWorkflows"],
      id: "futureFeature",
      packages: ["redux"],
      scripts: ["workflow:check"],
    })
    const workflowManifests = manifests.map((manifest) =>
      manifest.id === "founderChat"
        ? {
            ...manifest,
            packages: { ...manifest.packages, scripts: ["workflow:check"] },
          }
        : manifest,
    )
    const actual = planFeatureSelection({
      features: { founderChat: false, futureFeature: true, todos: false },
      manifests: [...workflowManifests, futureFeature],
    })
    const expected = {
      removedCapabilities: [],
      removedDependencies: [],
      removedScripts: [],
      retainedCapabilities: ["clientWorkflows"],
    }

    expect({
      removedCapabilities: actual.removedCapabilities,
      removedDependencies: actual.packageChanges.dependencies.remove,
      removedScripts: actual.packageChanges.scripts.remove,
      retainedCapabilities: actual.retainedCapabilities,
    }).toEqual(expected)
  })

  test("given: a selected feature with an unselected dependency, should: reject the selection", () => {
    const dependent = createManifest({ dependencies: ["todos"], id: "reports" })

    expect(() =>
      planFeatureSelection({
        features: { reports: true, todos: false },
        manifests: [manifests[0], dependent],
      }),
    ).toThrow('Feature "reports" requires selected feature "todos"')
  })

  test("given: a retained feature imports an undeclared optional feature, should: reject the plan", () => {
    expect(() =>
      planFeatureSelection({
        features: { founderChat: false, todos: true },
        manifests,
        projectFiles: {
          "app/features/todos/application/page.tsx":
            'import { chat } from "~/features/founderChat/application/chat"',
        },
      }),
    ).toThrow(
      'Feature "todos" imports optional feature "founderChat" without declaring a dependency',
    )
  })
})
