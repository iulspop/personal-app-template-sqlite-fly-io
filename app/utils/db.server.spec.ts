import { expect, test } from "vitest";

import { prisma } from "./db.server";

test("database connection works", async () => {
  const result = await prisma.$queryRawUnsafe("SELECT 1 AS ok");
  expect(result).toEqual([{ ok: 1n }]);
});
