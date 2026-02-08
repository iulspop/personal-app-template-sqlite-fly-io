import { z } from "zod";

import {
  CREATE_TODO_INTENT,
  DELETE_TODO_INTENT,
  TOGGLE_TODO_INTENT,
} from "../domain/todos-constants";

export const createTodoSchema = z.object({
  description: z.string().trim().default(""),
  intent: z.literal(CREATE_TODO_INTENT),
  title: z
    .string()
    .trim()
    .min(1, { message: "todos:validation.titleRequired" }),
});

export const toggleTodoSchema = z.object({
  id: z.string().min(1),
  intent: z.literal(TOGGLE_TODO_INTENT),
});

export const deleteTodoSchema = z.object({
  id: z.string().min(1),
  intent: z.literal(DELETE_TODO_INTENT),
});

export const todoActionSchema = z.discriminatedUnion("intent", [
  createTodoSchema,
  toggleTodoSchema,
  deleteTodoSchema,
]);

export type CreateTodoSchema = z.infer<typeof createTodoSchema>;
export type ToggleTodoSchema = z.infer<typeof toggleTodoSchema>;
export type DeleteTodoSchema = z.infer<typeof deleteTodoSchema>;
export type TodoActionSchema = z.infer<typeof todoActionSchema>;
