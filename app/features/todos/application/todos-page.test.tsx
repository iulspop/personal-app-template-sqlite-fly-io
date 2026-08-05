import { renderToString } from "react-dom/server"
import { createRoutesStub } from "react-router"
import { afterEach, describe, expect, test, vi } from "vitest"

import { createPopulatedTodo } from "../infrastructure/todos-factories.server"
import { TodosPageComponent } from "./todos-page"
import { render, screen } from "~/test/react-test-utils"

const defaultCounts = { active: 0, completed: 0, total: 0 }

afterEach(() => {
  vi.useRealTimers()
})

describe("TodosPageComponent", () => {
  test("given: no todos, should: render empty state message", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent counts={defaultCounts} filter="all" todos={[]} />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
  })

  test("given: the todos page, should: link to settings", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent counts={defaultCounts} filter="all" todos={[]} />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(
      screen.getAllByRole("link", { name: /settings/i })[0],
    ).toHaveAttribute("href", "/settings")
  })

  test("given: todos, should: render the todo list with status counts", () => {
    const todos = [
      createPopulatedTodo({ completed: false, id: "1", title: "First" }),
      createPopulatedTodo({ completed: true, id: "2", title: "Second" }),
    ]
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            counts={{ active: 1, completed: 1, total: 2 }}
            filter="all"
            todos={todos}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.getByText("First")).toBeInTheDocument()
    expect(screen.getByText("Second")).toBeInTheDocument()
    expect(
      screen
        .getByRole("link", { name: "Active" })
        .querySelector("span:last-child"),
    ).toHaveTextContent("1")
    expect(
      screen
        .getByRole("link", { name: "Completed" })
        .querySelector("span:last-child"),
    ).toHaveTextContent("1")
  })

  test("given: the user has no passkeys, should: link to passkey settings", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            counts={defaultCounts}
            filter="all"
            hasPasskeys={false}
            todos={[]}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.getByText(/add a passkey/i)).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /manage sign-in settings/i }),
    ).toHaveAttribute("href", "/settings")
  })

  test("given: the user has passkeys, should: hide passkey setup invitation", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            counts={defaultCounts}
            filter="all"
            hasPasskeys={true}
            todos={[]}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.queryByText(/add a passkey/i)).not.toBeInTheDocument()
  })

  test("given: the user's email is unverified, should: prompt email verification", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            counts={defaultCounts}
            filter="all"
            isEmailVerified={false}
            todos={[]}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /confirm your email address to finish setting up your account/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /resend verification email/i }),
    ).toBeInTheDocument()
  })

  test("given: the user's email is verified, should: hide email verification prompt", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            counts={defaultCounts}
            filter="all"
            isEmailVerified={true}
            todos={[]}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument()
  })

  test("given: a verification email was resent, should: show the resend countdown", () => {
    vi.useFakeTimers()
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            actionData={{
              cooldownSeconds: 120,
              error: null,
              intent: "resendEmailVerification",
              success: true,
            }}
            counts={defaultCounts}
            filter="all"
            isEmailVerified={false}
            todos={[]}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.getByText(/verification email sent/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /resend again in 2:00/i }),
    ).toBeDisabled()
  })

  test("given: a recent verification email exists after refresh, should: server render the resend countdown", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            counts={defaultCounts}
            filter="all"
            isEmailVerified={false}
            resendEmailVerificationCooldownSeconds={90}
            todos={[]}
          />
        ),
        path,
      },
    ])

    const html = renderToString(<RouterStub initialEntries={[path]} />)

    expect(html).toContain("Resend again in 1:30")
  })

  test("given: a recent verification email exists after refresh, should: show the resend countdown", () => {
    vi.useFakeTimers()
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            counts={defaultCounts}
            filter="all"
            isEmailVerified={false}
            resendEmailVerificationCooldownSeconds={90}
            todos={[]}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(
      screen.getByRole("button", { name: /resend again in 1:30/i }),
    ).toBeDisabled()
  })

  test("given: the page, should: render the add todo form", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent counts={defaultCounts} filter="all" todos={[]} />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(
      screen.getByPlaceholderText(/what needs to be done/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /add todo/i }),
    ).toBeInTheDocument()
  })

  test("given: actionData with TITLE_EMPTY error, should: display title required message", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            actionData={{ error: "TITLE_EMPTY", success: false }}
            counts={defaultCounts}
            filter="all"
            todos={[]}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.getByRole("alert")).toHaveTextContent(/title is required/i)
  })

  test("given: actionData with DESCRIPTION_TOO_LONG error, should: display description error message", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            actionData={{ error: "DESCRIPTION_TOO_LONG", success: false }}
            counts={defaultCounts}
            filter="all"
            todos={[]}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      /description must be 1000 characters or less/i,
    )
  })

  test("given: no actionData, should: not display any error", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent counts={defaultCounts} filter="all" todos={[]} />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  test("given: active filter with no active todos but total > 0, should: display filtered empty state", () => {
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            counts={{ active: 0, completed: 2, total: 2 }}
            filter="active"
            todos={[]}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(screen.getByText(/no active todos/i)).toBeInTheDocument()
  })

  test("given: completed todos exist, should: show clear completed button", () => {
    const todos = [
      createPopulatedTodo({ completed: true, id: "1", title: "Done" }),
    ]
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            counts={{ active: 0, completed: 1, total: 1 }}
            filter="all"
            todos={todos}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(
      screen.getByRole("button", { name: /clear completed/i }),
    ).toBeInTheDocument()
  })

  test("given: no completed todos, should: hide clear completed button", () => {
    const todos = [
      createPopulatedTodo({ completed: false, id: "1", title: "Active" }),
    ]
    const path = "/"
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <TodosPageComponent
            counts={{ active: 1, completed: 0, total: 1 }}
            filter="all"
            todos={todos}
          />
        ),
        path,
      },
    ])

    render(<RouterStub initialEntries={[path]} />)

    expect(
      screen.queryByRole("button", { name: /clear completed/i }),
    ).not.toBeInTheDocument()
  })
})
