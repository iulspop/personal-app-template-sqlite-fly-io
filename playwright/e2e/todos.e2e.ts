import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("todos page", () => {
  test("given: the todos page, should: display the page title", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Todos");
  });

  test("given: a new todo, should: create it and display it in the list", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByPlaceholder(/what needs to be done/i).fill("Buy groceries");
    await page.getByPlaceholder(/description/i).fill("Milk, eggs, bread");
    await page.getByRole("button", { name: /add todo/i }).click();

    await expect(page.getByText("Buy groceries")).toBeVisible();
    await expect(page.getByText("Milk, eggs, bread")).toBeVisible();
  });

  test("given: an existing todo, should: toggle its completion", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByPlaceholder(/what needs to be done/i).fill("Toggle me");
    await page.getByRole("button", { name: /add todo/i }).click();
    await expect(page.getByText("Toggle me")).toBeVisible();

    await page.getByRole("button", { name: /toggle toggle me/i }).click();

    await expect(page.getByText("Toggle me")).toHaveClass(/line-through/);
  });

  test("given: an existing todo, should: delete it from the list", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByPlaceholder(/what needs to be done/i).fill("Delete me");
    await page.getByRole("button", { name: /add todo/i }).click();
    await expect(page.getByText("Delete me")).toBeVisible();

    await page.getByRole("button", { name: /delete delete me/i }).click();

    await expect(page.getByText("Delete me")).not.toBeVisible();
  });

  test("given: the todos page, should: have no accessibility violations", async ({
    page,
  }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
