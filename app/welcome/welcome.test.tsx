import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Welcome } from "./welcome";

test("renders resource links", () => {
  render(<Welcome />);
  expect(screen.getByText("React Router Docs")).toBeInTheDocument();
  expect(screen.getByText("Join Discord")).toBeInTheDocument();
});
