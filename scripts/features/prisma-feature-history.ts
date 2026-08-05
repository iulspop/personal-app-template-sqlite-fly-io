import { stat } from "node:fs/promises"

import { removeSourceSlot } from "./source-slots"

export const removePrismaSchemaSlots = ({
  content,
  slots,
}: {
  content: string
  slots: string[]
}) =>
  [...slots].sort().reduce(
    (schema, contribution) =>
      removeSourceSlot({
        content: schema,
        contribution,
        slot: "prisma",
      }),
    content,
  )

export const assertSafePrismaFeatureRemoval = async ({
  databasePath,
  force = false,
}: {
  databasePath: string
  force?: boolean
}) => {
  if (force) return

  const database = await stat(databasePath).catch(() => null)
  if (database?.size)
    throw new Error(
      "Refusing Prisma feature removal while the development database exists. Back it up and pass --force-feature-removal to keep the database untouched while removing fresh-template schema history.",
    )
}
