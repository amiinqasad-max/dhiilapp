import { test, expect, uniqueEmail } from "./fixtures";
import { registerViaUI, postJobViaUI } from "./helpers";
import { db } from "./db";

test.describe("Client: register -> profile -> post job -> publish -> view", () => {
  test("a real client can post a job and see it live in the marketplace", async ({ page }) => {
    const email = uniqueEmail("client");
    const jobTitle = `E2E Client Job ${Date.now()}`;

    await registerViaUI(page, "CLIENT", { name: "E2E Client", email, password: "password123" });
    // Registration redirected straight to /jobs/new — DHIIL has no
    // separate "save draft" step; a job is created OPEN on submit (see
    // Job.status comment in prisma/schema.prisma). We post directly here.
    await postJobViaUI(page, {
      title: jobTitle,
      description: "A full description of the work that needs to be done for this end-to-end test.",
      category: "Design",
      budget: "250",
    });

    // "View job" from the success screen shows the real, saved job.
    await page.getByRole("link", { name: "View job" }).click();
    await expect(page.getByRole("heading", { name: jobTitle })).toBeVisible();
    await expect(page.getByText("Open", { exact: true })).toBeVisible();

    // It's also findable from the public marketplace listing.
    await page.goto("/jobs");
    await expect(page.getByRole("link", { name: new RegExp(jobTitle) })).toBeVisible();

    // Verify actual database state, not just what rendered.
    const job = await db.job.findFirst({ where: { title: jobTitle } });
    expect(job).not.toBeNull();
    expect(job?.status).toBe("OPEN");
    const client = await db.user.findUnique({ where: { email } });
    expect(job?.clientId).toBe(client?.id);
  });
});
