import { afterEach, describe, expect, test } from "vitest";

import {
  deleteTodoFromDatabaseById,
  retrieveAllTodosFromDatabase,
  retrieveTodoFromDatabaseById,
  saveTodoToDatabase,
  updateTodoInDatabaseById,
} from "./todos-model.server";
import { prisma } from "~/utils/db.server";

afterEach(async () => {
  await prisma.todo.deleteMany();
});

describe("saveTodoToDatabase()", () => {
  test("given: valid todo data, should: create and return the todo", async () => {
    const result = await saveTodoToDatabase({
      description: "Test description",
      title: "Test todo",
    });

    expect(result).toMatchObject({
      description: "Test description",
      title: "Test todo",
    });
    expect(result.id).toBeDefined();
  });
});

describe("retrieveAllTodosFromDatabase()", () => {
  test("given: multiple todos, should: return all todos newest first", async () => {
    await saveTodoToDatabase({ title: "First" });
    await saveTodoToDatabase({ title: "Second" });

    const todos = await retrieveAllTodosFromDatabase();

    expect(todos).toHaveLength(2);
    expect(todos[0]?.title).toBe("Second");
  });

  test("given: no todos, should: return empty array", async () => {
    const todos = await retrieveAllTodosFromDatabase();

    expect(todos).toEqual([]);
  });
});

describe("retrieveTodoFromDatabaseById()", () => {
  test("given: an existing id, should: return the todo", async () => {
    const created = await saveTodoToDatabase({ title: "Find me" });

    const found = await retrieveTodoFromDatabaseById(created.id);

    expect(found).toMatchObject({ id: created.id, title: "Find me" });
  });

  test("given: a non-existent id, should: return null", async () => {
    const found = await retrieveTodoFromDatabaseById("non-existent");

    expect(found).toBeNull();
  });
});

describe("updateTodoInDatabaseById()", () => {
  test("given: valid update data, should: update and return the todo", async () => {
    const created = await saveTodoToDatabase({
      completed: false,
      title: "Original",
    });

    const updated = await updateTodoInDatabaseById({
      data: { completed: true, title: "Updated" },
      id: created.id,
    });

    expect(updated).toMatchObject({
      completed: true,
      id: created.id,
      title: "Updated",
    });
  });
});

describe("deleteTodoFromDatabaseById()", () => {
  test("given: an existing id, should: delete and return the todo", async () => {
    const created = await saveTodoToDatabase({ title: "Delete me" });

    const deleted = await deleteTodoFromDatabaseById(created.id);

    expect(deleted.id).toBe(created.id);

    const found = await retrieveTodoFromDatabaseById(created.id);
    expect(found).toBeNull();
  });
});
