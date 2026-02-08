import { describe, expect, test } from "vitest";

import {
  CREATE_TODO_INTENT,
  DELETE_TODO_INTENT,
  TOGGLE_TODO_INTENT,
} from "../domain/todos-constants";
import { todoActionSchema } from "./todos-schemas";

describe("todoActionSchema", () => {
  test("given: valid createTodo data, should: parse successfully", () => {
    const result = todoActionSchema.safeParse({
      description: "Some details",
      intent: CREATE_TODO_INTENT,
      title: "Buy milk",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      description: "Some details",
      intent: CREATE_TODO_INTENT,
      title: "Buy milk",
    });
  });

  test("given: createTodo without description, should: default description to empty string", () => {
    const result = todoActionSchema.safeParse({
      intent: CREATE_TODO_INTENT,
      title: "Buy milk",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ description: "" });
  });

  test("given: createTodo with empty title, should: fail", () => {
    const result = todoActionSchema.safeParse({
      intent: CREATE_TODO_INTENT,
      title: "",
    });

    expect(result.success).toBe(false);
  });

  test("given: valid toggleTodo data, should: parse successfully", () => {
    const result = todoActionSchema.safeParse({
      id: "abc123",
      intent: TOGGLE_TODO_INTENT,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: "abc123",
      intent: TOGGLE_TODO_INTENT,
    });
  });

  test("given: toggleTodo with empty id, should: fail", () => {
    const result = todoActionSchema.safeParse({
      id: "",
      intent: TOGGLE_TODO_INTENT,
    });

    expect(result.success).toBe(false);
  });

  test("given: valid deleteTodo data, should: parse successfully", () => {
    const result = todoActionSchema.safeParse({
      id: "abc123",
      intent: DELETE_TODO_INTENT,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: "abc123",
      intent: DELETE_TODO_INTENT,
    });
  });

  test("given: unknown intent, should: fail", () => {
    const result = todoActionSchema.safeParse({
      intent: "unknownIntent",
      title: "test",
    });

    expect(result.success).toBe(false);
  });

  test("given: missing intent, should: fail", () => {
    const result = todoActionSchema.safeParse({ title: "test" });

    expect(result.success).toBe(false);
  });
});
