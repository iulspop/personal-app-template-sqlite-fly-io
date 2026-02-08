import { data } from "react-router";
import { match } from "ts-pattern";

import {
  CREATE_TODO_INTENT,
  DELETE_TODO_INTENT,
  TOGGLE_TODO_INTENT,
} from "../domain/todos-constants";
import {
  validateTodoDescription,
  validateTodoTitle,
} from "../domain/todos-domain";
import {
  deleteTodoFromDatabaseById,
  retrieveTodoFromDatabaseById,
  saveTodoToDatabase,
  updateTodoInDatabaseById,
} from "../infrastructure/todos-model.server";
import { todoActionSchema } from "./todos-schemas";
import type { Route } from ".react-router/types/app/routes/+types/index";

export const todosAction = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);
  const parsed = todoActionSchema.safeParse(rawData);

  if (!parsed.success)
    return data(
      { error: "Invalid form data", success: false as const },
      { status: 400 },
    );

  return match(parsed.data)
    .with({ intent: CREATE_TODO_INTENT }, async ({ description, title }) => {
      const titleResult = validateTodoTitle(title);
      if (!titleResult.success)
        return data(
          { error: titleResult.error, success: false as const },
          { status: 400 },
        );

      const descriptionResult = validateTodoDescription(description);
      if (!descriptionResult.success)
        return data(
          { error: descriptionResult.error, success: false as const },
          { status: 400 },
        );

      await saveTodoToDatabase({
        description: descriptionResult.data,
        title: titleResult.data,
      });

      return data({ error: null, success: true as const });
    })
    .with({ intent: TOGGLE_TODO_INTENT }, async ({ id }) => {
      const todo = await retrieveTodoFromDatabaseById(id);
      if (!todo)
        return data(
          { error: "Todo not found", success: false as const },
          { status: 404 },
        );

      await updateTodoInDatabaseById({
        data: { completed: !todo.completed },
        id,
      });

      return data({ error: null, success: true as const });
    })
    .with({ intent: DELETE_TODO_INTENT }, async ({ id }) => {
      await deleteTodoFromDatabaseById(id);
      return data({ error: null, success: true as const });
    })
    .exhaustive();
};
