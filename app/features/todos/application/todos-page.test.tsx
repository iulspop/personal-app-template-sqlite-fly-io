import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { createPopulatedTodo } from "../infrastructure/todos-factories.server";
import { TodosPageComponent } from "./todos-page";
import { render, screen } from "~/test/react-test-utils";

describe("TodosPageComponent", () => {
  test("given: no todos, should: render empty state message", () => {
    const path = "/todos";
    const RouterStub = createRoutesStub([
      { Component: () => <TodosPageComponent todos={[]} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
  });

  test("given: todos, should: render the todo list with status counts", () => {
    const todos = [
      createPopulatedTodo({ completed: false, id: "1", title: "First" }),
      createPopulatedTodo({ completed: true, id: "2", title: "Second" }),
    ];
    const path = "/todos";
    const RouterStub = createRoutesStub([
      { Component: () => <TodosPageComponent todos={todos} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("1 active")).toBeInTheDocument();
    expect(screen.getByText("1 completed")).toBeInTheDocument();
  });

  test("given: the page, should: render the add todo form", () => {
    const path = "/todos";
    const RouterStub = createRoutesStub([
      { Component: () => <TodosPageComponent todos={[]} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(
      screen.getByPlaceholderText(/what needs to be done/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add todo/i }),
    ).toBeInTheDocument();
  });
});
