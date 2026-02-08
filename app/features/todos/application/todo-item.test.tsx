import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { createPopulatedTodo } from "../infrastructure/todos-factories.server";
import { TodoItemComponent } from "./todo-item";
import { render, screen } from "~/test/react-test-utils";

describe("TodoItemComponent", () => {
  test("given: an incomplete todo, should: render the title without line-through", () => {
    const todo = createPopulatedTodo({ completed: false, title: "Buy milk" });
    const path = "/todos";
    const RouterStub = createRoutesStub([
      { Component: () => <TodoItemComponent todo={todo} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Buy milk")).not.toHaveClass("line-through");
  });

  test("given: a completed todo, should: render the title with line-through", () => {
    const todo = createPopulatedTodo({
      completed: true,
      title: "Done task",
    });
    const path = "/todos";
    const RouterStub = createRoutesStub([
      { Component: () => <TodoItemComponent todo={todo} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText("Done task")).toHaveClass("line-through");
  });

  test("given: a todo, should: render toggle and delete buttons", () => {
    const todo = createPopulatedTodo({ title: "Test todo" });
    const path = "/todos";
    const RouterStub = createRoutesStub([
      { Component: () => <TodoItemComponent todo={todo} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(
      screen.getByRole("button", { name: /toggle test todo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete test todo/i }),
    ).toBeInTheDocument();
  });

  test("given: a todo with description, should: render the description", () => {
    const todo = createPopulatedTodo({
      description: "Get whole milk",
      title: "Buy milk",
    });
    const path = "/todos";
    const RouterStub = createRoutesStub([
      { Component: () => <TodoItemComponent todo={todo} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText("Get whole milk")).toBeInTheDocument();
  });
});
