import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";

import type { User } from "../../../../generated/prisma/client";
import type { Factory } from "~/utils/types";

/**
 * Creates a user with populated values.
 *
 * @param userParams - User params to create user with.
 * @returns A populated user with given params.
 */
export const createPopulatedUser: Factory<User> = ({
  id = createId(),
  email = faker.internet.email(),
  name = faker.person.fullName(),
  updatedAt = faker.date.recent({ days: 10 }),
  createdAt = faker.date.past({ refDate: updatedAt, years: 3 }),
} = {}) => ({
  createdAt,
  email,
  id,
  name,
  updatedAt,
});
