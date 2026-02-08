import { describe, expect, test } from "vitest";

import type { Todo } from "./todos-domain";
import {
  countByStatus,
  filterTodos,
  toggleCompleted,
  validateTodoDescription,
  validateTodoTitle,
} from "./todos-domain";

const createTodo = (overrides: Partial<Todo> = {}): Todo => ({
  completed: false,
  createdAt: new Date("2024-01-01"),
  description: "",
  id: "test-id",
  title: "Test todo",
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

describe("validateTodoTitle()", () => {
  test("given: a valid title, should: return trimmed title", () => {
    const result = validateTodoTitle("  Buy groceries  ");

    expect(result).toEqual({ data: "Buy groceries", success: true });
  });

  test("given: an empty title, should: return TITLE_EMPTY error", () => {
    const result = validateTodoTitle("   ");

    expect(result).toEqual({ error: "TITLE_EMPTY", success: false });
  });

  test("given: a title exceeding max length, should: return TITLE_TOO_LONG error", () => {
    const longTitle = "a".repeat(201);
    const result = validateTodoTitle(longTitle);

    expect(result).toEqual({ error: "TITLE_TOO_LONG", success: false });
  });
});

describe("validateTodoDescription()", () => {
  test("given: a valid description, should: return trimmed description", () => {
    const result = validateTodoDescription("  Some details  ");

    expect(result).toEqual({ data: "Some details", success: true });
  });

  test("given: a description exceeding max length, should: return DESCRIPTION_TOO_LONG error", () => {
    const longDescription = "a".repeat(1001);
    const result = validateTodoDescription(longDescription);

    expect(result).toEqual({
      error: "DESCRIPTION_TOO_LONG",
      success: false,
    });
  });

  test("given: an empty description, should: return empty string as valid", () => {
    const result = validateTodoDescription("");

    expect(result).toEqual({ data: "", success: true });
  });
});

describe("toggleCompleted()", () => {
  test("given: false, should: return true", () => {
    expect(toggleCompleted(false)).toBe(true);
  });

  test("given: true, should: return false", () => {
    expect(toggleCompleted(true)).toBe(false);
  });
});

describe("filterTodos()", () => {
  const todos: Todo[] = [
    createTodo({ completed: false, id: "1", title: "Active" }),
    createTodo({ completed: true, id: "2", title: "Done" }),
    createTodo({ completed: false, id: "3", title: "Also active" }),
  ];

  test("given: filter 'all', should: return all todos", () => {
    expect(filterTodos(todos, "all")).toHaveLength(3);
  });

  test("given: filter 'active', should: return only incomplete todos", () => {
    const result = filterTodos(todos, "active");

    expect(result).toHaveLength(2);
    expect(result.every((t) => !t.completed)).toBe(true);
  });

  test("given: filter 'completed', should: return only completed todos", () => {
    const result = filterTodos(todos, "completed");

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Done");
  });
});

describe("countByStatus()", () => {
  test("given: a mixed list, should: return correct counts", () => {
    const todos: Todo[] = [
      createTodo({ completed: false, id: "1" }),
      createTodo({ completed: true, id: "2" }),
      createTodo({ completed: false, id: "3" }),
    ];

    expect(countByStatus(todos)).toEqual({
      active: 2,
      completed: 1,
      total: 3,
    });
  });

  test("given: an empty list, should: return all zeros", () => {
    expect(countByStatus([])).toEqual({
      active: 0,
      completed: 0,
      total: 0,
    });
  });
});
