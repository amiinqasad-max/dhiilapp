import { test, expect, uniqueEmail } from "./fixtures";
import { registerViaUI, loginViaUI, logoutViaUI, postJobViaUI, authHeader } from "./helpers";
import { db } from "./db";

test.describe("Cross-role and ownership authorization (real browser sessions, not shared state)", () => {
  test("Client B cannot edit or view applications for Client A's job", async ({ page }) => {
    const clientAEmail = uniqueEmail("auth-client-a");
    const clientBEmail = uniqueEmail("auth-client-b");
    const jobTitle = `E2E Auth Job ${Date.now()}`;

    await registerViaUI(page, "CLIENT", { name: "Client A", email: clientAEmail, password: "password123" });
    await postJobViaUI(page, {
      title: jobTitle,
      description: "A job owned by Client A that Client B must never be able to touch.",
      category: "Design",
      budget: "200",
    });
    const job = await db.job.findFirst({ where: { title: jobTitle } });
    await logoutViaUI(page);

    await registerViaUI(page, "CLIENT", { name: "Client B", email: clientBEmail, password: "password123" });

    // Client B cannot see Client A's job status-control actions and gets
    // a real 403 from the server if they try the API directly (never a
    // client-only illusion of being blocked).
    await page.goto(`/jobs/${job!.id}`);
    await expect(page.getByRole("button", { name: "Pause job" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: /View applications/ })).not.toBeVisible();

    const res = await page.request.patch(`/api/jobs/${job!.id}`, {
      data: { status: "CLOSED" },
      headers: await authHeader(page),
    });
    expect(res.status()).toBe(403);

    const applicationsRes = await page.request.get(`/api/jobs/${job!.id}/applications`, {
      headers: await authHeader(page),
    });
    expect(applicationsRes.status()).toBe(403);

    // The job itself is unchanged in the database.
    const untouchedJob = await db.job.findUnique({ where: { id: job!.id } });
    expect(untouchedJob?.status).toBe("OPEN");
  });

  test("Professional B cannot withdraw Professional A's application or accept applications", async ({ page }) => {
    const clientEmail = uniqueEmail("auth-client-c");
    const proAEmail = uniqueEmail("auth-pro-a");
    const proBEmail = uniqueEmail("auth-pro-b");
    const jobTitle = `E2E Auth Job B ${Date.now()}`;

    await registerViaUI(page, "CLIENT", { name: "Job Owner", email: clientEmail, password: "password123" });
    await postJobViaUI(page, {
      title: jobTitle,
      description: "Job used to test that one professional cannot touch another's application.",
      category: "Marketing",
      budget: "150",
    });
    const job = await db.job.findFirst({ where: { title: jobTitle } });
    await logoutViaUI(page);

    await registerViaUI(page, "PROFESSIONAL", { name: "Professional A", email: proAEmail, password: "password123" });
    await page.goto(`/jobs/${job!.id}/apply`);
    await page.getByLabel("Cover letter").fill("Professional A's real application cover letter text here.");
    await page.getByLabel("Proposed price (USD)").fill("140");
    await page.getByLabel("Delivery time").fill("3 days");
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByRole("heading", { name: "Application Ready" })).toBeVisible();
    await logoutViaUI(page);

    const application = await db.application.findFirst({ where: { jobId: job!.id } });

    await registerViaUI(page, "PROFESSIONAL", { name: "Professional B", email: proBEmail, password: "password123" });
    const withdrawRes = await page.request.patch(`/api/applications/${application!.id}/status`, {
      data: { status: "WITHDRAWN" },
      headers: await authHeader(page),
    });
    expect(withdrawRes.status()).toBe(403);

    // Professional B (not the job's client) cannot accept it either.
    const acceptRes = await page.request.patch(`/api/applications/${application!.id}/status`, {
      data: { status: "ACCEPTED" },
      headers: await authHeader(page),
    });
    expect([400, 403]).toContain(acceptRes.status());

    const untouchedApp = await db.application.findUnique({ where: { id: application!.id } });
    expect(untouchedApp?.status).toBe("PENDING");
  });

  test("An unauthenticated visitor is redirected away from protected pages and gets 401 from protected APIs", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/jobs/new");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login/);

    const res = await page.request.get("/api/applications");
    expect(res.status()).toBe(401);

    const postRes = await page.request.post("/api/jobs", {
      data: { title: "x".repeat(10), description: "x".repeat(30), category: "x", budget: 1 },
    });
    expect(postRes.status()).toBe(401);
  });

  test("a project is invisible to a user who is not one of its two participants", async ({ page }) => {
    const clientEmail = uniqueEmail("auth-proj-client");
    const proEmail = uniqueEmail("auth-proj-pro");
    const outsiderEmail = uniqueEmail("auth-proj-outsider");
    const jobTitle = `E2E Auth Project ${Date.now()}`;

    await registerViaUI(page, "CLIENT", { name: "Project Client", email: clientEmail, password: "password123" });
    await postJobViaUI(page, {
      title: jobTitle,
      description: "Job that becomes a private project only its two participants may see.",
      category: "Design",
      budget: "220",
    });
    const job = await db.job.findFirst({ where: { title: jobTitle } });
    await logoutViaUI(page);

    await registerViaUI(page, "PROFESSIONAL", { name: "Project Pro", email: proEmail, password: "password123" });
    await page.goto(`/jobs/${job!.id}/apply`);
    await page.getByLabel("Cover letter").fill("Applying so this job can become a project for the auth test.");
    await page.getByLabel("Proposed price (USD)").fill("200");
    await page.getByLabel("Delivery time").fill("2 days");
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByRole("heading", { name: "Application Ready" })).toBeVisible();
    await logoutViaUI(page);

    await loginViaUI(page, { email: clientEmail, password: "password123" });
    await page.goto(`/jobs/${job!.id}/applications`);
    await page.getByRole("button", { name: "Accept" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Accept & start project" }).click();
    await expect(page.getByRole("heading", { name: "Project Started" })).toBeVisible();
    const project = await db.project.findFirst({ where: { jobId: job!.id } });
    await logoutViaUI(page);

    await registerViaUI(page, "CLIENT", { name: "Outsider", email: outsiderEmail, password: "password123" });
    await page.goto(`/projects/${project!.id}`);
    // Private data is not even acknowledged to exist for a non-participant.
    await expect(page.getByText("Project not found")).toBeVisible();
    const res = await page.request.get(`/api/projects/${project!.id}`, { headers: await authHeader(page) });
    expect(res.status()).toBe(404);
  });
});
