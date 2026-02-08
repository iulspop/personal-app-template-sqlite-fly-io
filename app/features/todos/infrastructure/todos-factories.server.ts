import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";

import type { Todo } from "../../../../generated/prisma/client";
import type { Factory } from "~/utils/types";

/**
 * Creates a todo with populated values.
 *
 * @param todoParams - Todo params to create a todo with.
 * @returns A populated todo with given params.
 */
export const createPopulatedTodo: Factory<Todo> = ({
  id = createId(),
  title = faker.lorem.sentence(),
  description = faker.lorem.paragraph(),
  completed = false,
  updatedAt = faker.date.recent({ days: 10 }),
  createdAt = faker.date.past({ refDate: updatedAt, years: 1 }),
} = {}) => ({
  completed,
  createdAt,
  description,
  id,
  title,
  updatedAt,
});
