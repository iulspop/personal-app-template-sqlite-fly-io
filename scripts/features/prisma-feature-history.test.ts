import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, test } from "vitest"

import {
  assertSafePrismaFeatureRemoval,
  removePrismaSchemaSlots,
} from "./prisma-feature-history"

const schema = `model User {
  id String @id
  // FEATURE_SLOT_BEGIN:prisma:chatRelations
  chats Chat[]
  // FEATURE_SLOT_END:prisma:chatRelations
}

// FEATURE_SLOT_BEGIN:prisma:chatModels
model Chat {
  id String @id
}
// FEATURE_SLOT_END:prisma:chatModels
`

describe("Prisma feature history", () => {
  test("given: declared Prisma slots, should: remove only exact marked fragments", () => {
    const actual = removePrismaSchemaSlots({
      content: schema,
      slots: ["chatModels", "chatRelations"],
    })
    const expected = `model User {
  id String @id
}

`

    expect(actual).toEqual(expected)
  })

  test("given: an existing development database, should: require an explicit force override", async () => {
    const root = await mkdtemp(join(tmpdir(), "prisma-feature-"))
    const databasePath = join(root, "dev.db")
    await writeFile(databasePath, "existing database")

    await expect(
      assertSafePrismaFeatureRemoval({ databasePath, force: false }),
    ).rejects.toThrow(
      "Refusing Prisma feature removal while the development database exists",
    )
    await expect(
      assertSafePrismaFeatureRemoval({ databasePath, force: true }),
    ).resolves.toBeUndefined()
  })
})
