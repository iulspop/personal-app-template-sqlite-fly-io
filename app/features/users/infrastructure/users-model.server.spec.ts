import { afterEach, describe, expect, test } from "vitest";

import {
  retrieveUserFromDatabaseById,
  saveUserToDatabase,
} from "./users-model.server";
import { prisma } from "~/utils/db.server";

afterEach(async () => {
  await prisma.user.deleteMany();
});

describe("saveUserToDatabase()", () => {
  test("given: valid user data, should: create and return the user", async () => {
    const result = await saveUserToDatabase({
      email: "test@example.com",
      name: "Test User",
    });

    expect(result).toMatchObject({
      email: "test@example.com",
      name: "Test User",
    });
    expect(result.id).toBeDefined();
  });
});

describe("retrieveUserFromDatabaseById()", () => {
  test("given: an existing id, should: return the user", async () => {
    const created = await saveUserToDatabase({
      email: "find@example.com",
      name: "Find Me",
    });

    const found = await retrieveUserFromDatabaseById(created.id);

    expect(found).toMatchObject({ id: created.id, name: "Find Me" });
  });

  test("given: a non-existent id, should: return null", async () => {
    const found = await retrieveUserFromDatabaseById("non-existent");

    expect(found).toBeNull();
  });
});
