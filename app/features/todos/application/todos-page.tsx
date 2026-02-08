import { useTranslation } from "react-i18next";
import { Form } from "react-router";

import type { Todo } from "../../../../generated/prisma/client";
import { CREATE_TODO_INTENT } from "../domain/todos-constants";
import { countByStatus } from "../domain/todos-domain";
import { TodoItemComponent } from "./todo-item";

export function TodosPageComponent({ todos }: { todos: Todo[] }) {
  const { t } = useTranslation("todos");
  const counts = countByStatus(todos);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-gray-100">
        {t("pageTitle")}
      </h1>

      <Form className="mb-8 space-y-4" method="post">
        <div>
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            name="title"
            placeholder={t("titlePlaceholder")}
            type="text"
          />
        </div>
        <div>
          <textarea
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            name="description"
            placeholder={t("description")}
            rows={2}
          />
        </div>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          name="intent"
          type="submit"
          value={CREATE_TODO_INTENT}
        >
          {t("addTodo")}
        </button>
      </Form>

      {todos.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          {t("emptyState")}
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {todos.map((todo) => (
              <TodoItemComponent key={todo.id} todo={todo} />
            ))}
          </ul>

          <footer className="mt-6 flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{t("activeCount", { count: counts.active })}</span>
            <span>{t("completedCount", { count: counts.completed })}</span>
          </footer>
        </>
      )}
    </main>
  );
}
