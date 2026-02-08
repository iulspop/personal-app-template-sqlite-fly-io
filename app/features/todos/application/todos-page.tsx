import { useTranslation } from "react-i18next";
import { Form } from "react-router";

import type { Todo } from "../../../../generated/prisma/client";
import {
  CLEAR_COMPLETED_INTENT,
  CREATE_TODO_INTENT,
} from "../domain/todos-constants";
import type { TodoFilter } from "../domain/todos-domain";
import {
  isTodoValidationError,
  validationErrorToI18nKey,
} from "../domain/todos-domain";
import { FilterTabsComponent } from "./filter-tabs";
import { TodoItemComponent } from "./todo-item";
import { Button } from "~/components/ui/button";
import { FieldError } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

type TodosPageActionData =
  | { error: string; success: false }
  | { error: null; success: true }
  | undefined;

export function TodosPageComponent({
  actionData,
  counts,
  filter,
  todos,
}: {
  actionData?: TodosPageActionData;
  counts: { active: number; completed: number; total: number };
  filter: TodoFilter;
  todos: Todo[];
}) {
  const { t } = useTranslation("todos");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t("pageTitle")}</h1>
        <Form action="/logout" method="post">
          <Button size="sm" type="submit" variant="outline">
            {t("translation:logout", { defaultValue: "Log out" })}
          </Button>
        </Form>
      </div>

      <Form className="mb-8 space-y-4" method="post">
        <div>
          <Input name="title" placeholder={t("titlePlaceholder")} type="text" />
        </div>
        <div>
          <Textarea
            name="description"
            placeholder={t("description")}
            rows={2}
          />
        </div>
        <Button name="intent" type="submit" value={CREATE_TODO_INTENT}>
          {t("addTodo")}
        </Button>
        {actionData?.success === false &&
          isTodoValidationError(actionData.error) && (
            <FieldError>
              {t(validationErrorToI18nKey(actionData.error))}
            </FieldError>
          )}
      </Form>

      <FilterTabsComponent currentFilter={filter} />

      {counts.total === 0 ? (
        <p className="text-center text-muted-foreground">{t("emptyState")}</p>
      ) : todos.length === 0 ? (
        <p className="text-center text-muted-foreground">
          {t(
            `emptyFiltered.${filter}` as
              | "emptyFiltered.active"
              | "emptyFiltered.completed",
          )}
        </p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <TodoItemComponent key={todo.id} todo={todo} />
          ))}
        </ul>
      )}

      <footer className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>{t("activeCount", { count: counts.active })}</span>
        {counts.completed > 0 && (
          <Form method="post">
            <Button
              className="text-destructive"
              name="intent"
              type="submit"
              value={CLEAR_COMPLETED_INTENT}
              variant="link"
            >
              {t("clearCompleted")}
            </Button>
          </Form>
        )}
        <span>{t("completedCount", { count: counts.completed })}</span>
      </footer>
    </main>
  );
}
