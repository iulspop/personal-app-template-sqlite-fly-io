import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Form, useFetcher } from "react-router";

import type { Todo } from "../../../../generated/prisma/client";
import {
  DELETE_TODO_INTENT,
  TOGGLE_TODO_INTENT,
} from "../domain/todos-constants";
import { TodoItemEditComponent } from "./todo-item-edit";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function TodoItemDisplayComponent({
  onEdit,
  todo,
}: {
  onEdit: () => void;
  todo: Todo;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border p-4">
      <Form method="post">
        <input name="id" type="hidden" value={todo.id} />
        <Button
          aria-label={`Toggle ${todo.title}`}
          className={cn(
            "size-5",
            todo.completed &&
              "border-primary bg-primary text-primary-foreground",
          )}
          name="intent"
          size="icon-xs"
          type="submit"
          value={TOGGLE_TODO_INTENT}
          variant="outline"
        >
          {todo.completed && <IconCheck className="size-3" />}
        </Button>
      </Form>

      <div className="flex-1">
        <span
          className={todo.completed ? "text-muted-foreground line-through" : ""}
        >
          {todo.title}
        </span>
        {todo.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {todo.description}
          </p>
        )}
      </div>

      <Button
        aria-label={`Edit ${todo.title}`}
        onClick={onEdit}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <IconPencil className="size-4" />
      </Button>

      <Form method="post">
        <input name="id" type="hidden" value={todo.id} />
        <Button
          aria-label={`Delete ${todo.title}`}
          name="intent"
          size="icon-xs"
          type="submit"
          value={DELETE_TODO_INTENT}
          variant="ghost"
        >
          <IconX className="size-4" />
        </Button>
      </Form>
    </li>
  );
}

export function TodoItemComponent({ todo }: { todo: Todo }) {
  const [isEditing, setIsEditing] = useState(false);
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setIsEditing(false);
    }
  }, [fetcher.state, fetcher.data]);

  if (isEditing) {
    return (
      <TodoItemEditComponent
        fetcher={fetcher}
        onCancel={() => setIsEditing(false)}
        todo={todo}
      />
    );
  }

  return (
    <TodoItemDisplayComponent onEdit={() => setIsEditing(true)} todo={todo} />
  );
}
