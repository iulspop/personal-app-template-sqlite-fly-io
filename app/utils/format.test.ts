import { expect, test } from "vitest";

import { formatDate } from "./format";

test("formatDate formats a date as Month Day, Year", () => {
  const date = new Date(2025, 0, 15);
  expect(formatDate(date)).toBe("January 15, 2025");
});
