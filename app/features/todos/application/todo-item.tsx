import { Form } from "react-router";

import type { Todo } from "../../../../generated/prisma/client";
import {
  DELETE_TODO_INTENT,
  TOGGLE_TODO_INTENT,
} from "../domain/todos-constants";

export function TodoItemComponent({ todo }: { todo: Todo }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <Form method="post">
        <input name="id" type="hidden" value={todo.id} />
        <button
          aria-label={`Toggle ${todo.title}`}
          className={`size-5 rounded border ${
            todo.completed
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-gray-400 dark:border-gray-500"
          } flex items-center justify-center`}
          name="intent"
          type="submit"
          value={TOGGLE_TODO_INTENT}
        >
          {todo.completed && (
            <svg
              aria-hidden="true"
              className="size-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
              />
            </svg>
          )}
        </button>
      </Form>

      <div className="flex-1">
        <span
          className={
            todo.completed
              ? "text-gray-500 line-through dark:text-gray-400"
              : ""
          }
        >
          {todo.title}
        </span>
        {todo.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {todo.description}
          </p>
        )}
      </div>

      <Form method="post">
        <input name="id" type="hidden" value={todo.id} />
        <button
          aria-label={`Delete ${todo.title}`}
          className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          name="intent"
          type="submit"
          value={DELETE_TODO_INTENT}
        >
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>
      </Form>
    </li>
  );
}
