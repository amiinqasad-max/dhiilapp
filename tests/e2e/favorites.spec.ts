import { test, expect, uniqueEmail } from "./fixtures";
import { registerViaUI, postJobViaUI, logoutViaUI } from "./helpers";

test.describe("Favorites list page", () => {
  test("a professional can save a job, see it on /favorites, and remove it", async ({ page }) => {
    const clientEmail = uniqueEmail("fav-client");
    const proEmail = uniqueEmail("fav-pro");
    const jobTitle = `E2E Favorite Job ${Date.now()}`;

    await registerViaUI(page, "CLIENT", { name: "Fav Job Owner", email: clientEmail, password: "password123" });
    await postJobViaUI(page, {
      title: jobTitle,
      description: "A job that a professional will save to their favorites list.",
      category: "Design",
      budget: "190",
    });
    await logoutViaUI(page);

    await registerViaUI(page, "PROFESSIONAL", { name: "Fav Professional", email: proEmail, password: "password123" });
    await page.goto("/favorites");
    await expect(page.getByText("No saved jobs yet")).toBeVisible();

    await page.goto("/jobs");
    await page.getByRole("link", { name: new RegExp(jobTitle) }).first().click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

    await page.goto("/favorites");
    await expect(page.getByText(jobTitle)).toBeVisible();

    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("No saved jobs yet")).toBeVisible();
  });

  test("a client can save a professional, see them on /favorites, and remove them", async ({ page }) => {
    const clientEmail = uniqueEmail("fav-client-2");
    const proEmail = uniqueEmail("fav-pro-2");

    await registerViaUI(page, "PROFESSIONAL", { name: "Saveable Pro", email: proEmail, password: "password123" });
    await logoutViaUI(page);

    await registerViaUI(page, "CLIENT", { name: "Fav Client", email: clientEmail, password: "password123" });
    await page.goto("/professionals");
    await page.getByRole("link", { name: "Saveable Pro" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

    await page.goto("/favorites");
    await expect(page.getByText("Saveable Pro")).toBeVisible();

    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("No saved professionals yet")).toBeVisible();
  });
});
