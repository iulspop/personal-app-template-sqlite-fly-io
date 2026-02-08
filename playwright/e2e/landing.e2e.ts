import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("given the landing page: shows the welcome content", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("New React Router App");
  });

  test("given the landing page: has no accessibility violations", async ({
    page,
  }) => {
    await page.goto("/");
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(["page-has-heading-one"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
