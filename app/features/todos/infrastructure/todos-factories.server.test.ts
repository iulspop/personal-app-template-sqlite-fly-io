import { describe, expect, test } from "vitest";

import { createPopulatedTodo } from "./todos-factories.server";

describe("createPopulatedTodo()", () => {
  test("given: no overrides, should: return a todo with all fields populated", () => {
    const todo = createPopulatedTodo();

    expect(todo.id).toBeDefined();
    expect(todo.title).toBeDefined();
    expect(todo.description).toBeDefined();
    expect(todo.completed).toBe(false);
    expect(todo.createdAt).toBeInstanceOf(Date);
    expect(todo.updatedAt).toBeInstanceOf(Date);
  });

  test("given: overrides, should: use overridden values", () => {
    const todo = createPopulatedTodo({
      completed: true,
      title: "Custom title",
    });

    expect(todo.title).toBe("Custom title");
    expect(todo.completed).toBe(true);
  });

  test("given: two calls, should: return distinct ids", () => {
    const a = createPopulatedTodo();
    const b = createPopulatedTodo();

    expect(a.id).not.toBe(b.id);
  });
});
