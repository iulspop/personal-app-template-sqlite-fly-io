import type { Prisma, Todo } from "../../../../generated/prisma/client";
import { prisma } from "~/utils/db.server";

/**
 * Saves a new todo to the database.
 *
 * @param todo - The data for the todo to create.
 * @returns The newly created todo.
 */
export async function saveTodoToDatabase(todo: Prisma.TodoCreateInput) {
  return prisma.todo.create({ data: todo });
}

/**
 * Retrieves all todos from the database, ordered by creation date descending.
 *
 * @returns All todos, newest first.
 */
export async function retrieveAllTodosFromDatabase() {
  return prisma.todo.findMany({ orderBy: { createdAt: "desc" } });
}

/**
 * Retrieves a single todo by its id.
 *
 * @param id - The id of the todo to retrieve.
 * @returns The todo or null if not found.
 */
export async function retrieveTodoFromDatabaseById(id: Todo["id"]) {
  return prisma.todo.findUnique({ where: { id } });
}

/**
 * Updates a todo by its id.
 *
 * @param id - The id of the todo to update.
 * @param data - The new data for the todo.
 * @returns The updated todo.
 */
export async function updateTodoInDatabaseById({
  data,
  id,
}: {
  data: Prisma.TodoUpdateInput;
  id: Todo["id"];
}) {
  return prisma.todo.update({ data, where: { id } });
}

/**
 * Deletes a todo by its id.
 *
 * @param id - The id of the todo to delete.
 * @returns The deleted todo.
 */
export async function deleteTodoFromDatabaseById(id: Todo["id"]) {
  return prisma.todo.delete({ where: { id } });
}
