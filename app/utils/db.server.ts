import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../../generated/prisma/client";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient;
}

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaBetterSqlite3({ url });
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalThis.__db__) {
    const adapter = new PrismaBetterSqlite3({ url });
    globalThis.__db__ = new PrismaClient({ adapter });
  }
  prisma = globalThis.__db__;
}

export { prisma };
