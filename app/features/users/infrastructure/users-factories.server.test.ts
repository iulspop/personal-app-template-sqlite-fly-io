import { describe, expect, test } from "vitest";

import { createPopulatedUser } from "./users-factories.server";

describe("createPopulatedUser()", () => {
  test("given: no overrides, should: return a user with all fields populated", () => {
    const user = createPopulatedUser();

    expect(user.id).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.name).toBeDefined();
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  test("given: overrides, should: use overridden values", () => {
    const user = createPopulatedUser({
      email: "custom@test.com",
      name: "Custom Name",
    });

    expect(user.email).toBe("custom@test.com");
    expect(user.name).toBe("Custom Name");
  });

  test("given: two calls, should: return distinct ids", () => {
    const a = createPopulatedUser();
    const b = createPopulatedUser();

    expect(a.id).not.toBe(b.id);
  });
});
