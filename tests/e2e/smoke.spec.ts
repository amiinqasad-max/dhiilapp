import { test, expect } from "@playwright/test";

test("home page renders and jobs marketplace loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/DHIIL/i);

  await page.goto("/jobs");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
