// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * A todo item. Mirrors the Prisma shape but defined independently
 * so the domain layer has zero external imports.
 */
export type Todo = {
  completed: boolean;
  createdAt: Date;
  description: string;
  id: string;
  title: string;
  updatedAt: Date;
};

export type TodoFilter = "active" | "all" | "completed";

/**
 * Discriminated result union. Defined locally so the domain file
 * remains pure (zero imports).
 */
export type Result<T, E> =
  | { error: E; success: false }
  | { data: T; success: true };

export type TodoValidationError =
  | "DESCRIPTION_TOO_LONG"
  | "TITLE_EMPTY"
  | "TITLE_TOO_LONG";

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 1000;

// ─── Functions ───────────────────────────────────────────────────────────────

/**
 * Validates a todo title. Returns the trimmed title on success.
 */
export const validateTodoTitle = (
  title: string,
): Result<string, TodoValidationError> => {
  const trimmed = title.trim();
  if (trimmed.length === 0) return { error: "TITLE_EMPTY", success: false };
  if (trimmed.length > MAX_TITLE_LENGTH)
    return { error: "TITLE_TOO_LONG", success: false };
  return { data: trimmed, success: true };
};

/**
 * Validates a todo description. Returns the trimmed description on success.
 */
export const validateTodoDescription = (
  description: string,
): Result<string, TodoValidationError> => {
  const trimmed = description.trim();
  if (trimmed.length > MAX_DESCRIPTION_LENGTH)
    return { error: "DESCRIPTION_TOO_LONG", success: false };
  return { data: trimmed, success: true };
};

/**
 * Flips the completed status of a todo.
 */
export const toggleCompleted = (completed: boolean): boolean => !completed;

/**
 * Filters todos by their completion status.
 */
export const filterTodos = (todos: Todo[], filter: TodoFilter): Todo[] => {
  switch (filter) {
    case "active":
      return todos.filter((todo) => !todo.completed);
    case "all":
      return todos;
    case "completed":
      return todos.filter((todo) => todo.completed);
  }
};

/**
 * Counts todos by their completion status.
 */
export const countByStatus = (
  todos: Todo[],
): { active: number; completed: number; total: number } => {
  const completed = todos.filter((todo) => todo.completed).length;
  return {
    active: todos.length - completed,
    completed,
    total: todos.length,
  };
};
