import { test, expect, uniqueEmail } from "./fixtures";
import { registerViaUI, postJobViaUI, applyToJobViaUI, loginViaUI, logoutViaUI } from "./helpers";
import { db } from "./db";

// The single most important browser test in the suite: drives the full
// marketplace lifecycle end to end through the real rendered UI, and
// checks the real database after each server-side transition — not just
// what the page happens to show.
test.describe("Full marketplace lifecycle", () => {
  test("post -> apply -> shortlist -> accept -> project -> complete -> review both ways -> public visibility", async ({
    page,
  }) => {
    const clientEmail = uniqueEmail("lifecycle-client");
    const proEmail = uniqueEmail("lifecycle-pro");
    const jobTitle = `E2E Lifecycle Job ${Date.now()}`;

    // --- Client posts + publishes a job ---
    await registerViaUI(page, "CLIENT", { name: "Lifecycle Client", email: clientEmail, password: "password123" });
    await postJobViaUI(page, {
      title: jobTitle,
      description: "Full lifecycle end-to-end test: apply, accept, complete, review.",
      category: "Writing",
      budget: "300",
    });
    await logoutViaUI(page);

    // --- Professional applies ---
    await registerViaUI(page, "PROFESSIONAL", { name: "Lifecycle Pro", email: proEmail, password: "password123" });
    await applyToJobViaUI(page, jobTitle, {
      coverLetter: "I'd like to take this on — full lifecycle coverage test application.",
      proposedPrice: "280",
      deliveryTime: "5 days",
    });
    await logoutViaUI(page);

    const job = await db.job.findFirst({ where: { title: jobTitle } });
    const application = await db.application.findFirst({ where: { jobId: job!.id } });
    expect(application?.status).toBe("PENDING");

    // --- Client views, shortlists, accepts ---
    await loginViaUI(page, { email: clientEmail, password: "password123" });
    await page.goto(`/jobs/${job!.id}/applications`);
    await expect(page.getByText("Lifecycle Pro")).toBeVisible();

    await page.getByRole("button", { name: "Shortlist" }).click();
    await expect(page.getByText("Shortlisted", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Accept" }).click();
    // Real confirmation dialog — accepting a professional is a
    // hard-to-reverse action and must not happen on a single click.
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Accept this professional?")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Accept & start project" }).click();

    // Server response drives the UI — never a locally simulated result.
    await expect(page.getByRole("heading", { name: "Project Started" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "View project" }).click();
    await expect(page).toHaveURL(/\/projects\//);
    await expect(page.getByText("Active", { exact: true })).toBeVisible();

    // Verify the real transactional side effects in the database.
    const acceptedApp = await db.application.findFirst({ where: { jobId: job!.id } });
    expect(acceptedApp?.status).toBe("ACCEPTED");
    const closedJob = await db.job.findUnique({ where: { id: job!.id } });
    expect(closedJob?.status).toBe("CLOSED");
    const project = await db.project.findFirst({ where: { jobId: job!.id } });
    expect(project).not.toBeNull();
    expect(project?.status).toBe("ACTIVE");

    // --- Client marks the project completed ---
    await page.getByRole("button", { name: "Mark as completed" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Mark as completed" }).click();
    await expect(page.getByText("Completed", { exact: true }).first()).toBeVisible({ timeout: 10_000 });

    const completedProject = await db.project.findUnique({ where: { id: project!.id } });
    expect(completedProject?.status).toBe("COMPLETED");
    const completedJob = await db.job.findUnique({ where: { id: job!.id } });
    expect(completedJob?.status).toBe("COMPLETED");

    // --- Client leaves a review ---
    await page.getByRole("radio", { name: "5 / 5" }).click();
    await page.getByLabel("Comment (optional)").fill("Excellent work, delivered on time.");
    await page.getByRole("button", { name: "Submit review" }).click();
    await expect(page.getByText("Excellent work, delivered on time.")).toBeVisible();

    // Duplicate review from the same reviewer is not offered again.
    await expect(page.getByRole("button", { name: "Submit review" })).not.toBeVisible();

    // --- Professional leaves a review of the client ---
    await logoutViaUI(page);
    await loginViaUI(page, { email: proEmail, password: "password123" });
    await page.goto(`/projects/${project!.id}`);
    await expect(page.getByRole("heading", { name: "Leave a review" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("radio", { name: "4 / 5" }).click();
    await page.getByLabel("Comment (optional)").fill("Clear brief, great client to work with.");
    await page.getByRole("button", { name: "Submit review" }).click();
    await expect(page.getByText("Clear brief, great client to work with.")).toBeVisible();

    // Verify both reviews landed in the database, correctly attributed.
    const reviews = await db.review.findMany({ where: { projectId: project!.id } });
    expect(reviews).toHaveLength(2);
    const client = await db.user.findUnique({ where: { email: clientEmail } });
    const professional = await db.user.findUnique({ where: { email: proEmail } });
    const clientReview = reviews.find((r) => r.reviewerId === client!.id);
    const proReview = reviews.find((r) => r.reviewerId === professional!.id);
    expect(clientReview?.revieweeId).toBe(professional!.id);
    expect(clientReview?.rating).toBe(5);
    expect(proReview?.revieweeId).toBe(client!.id);
    expect(proReview?.rating).toBe(4);

    // --- The professional's review is publicly visible on their profile ---
    await logoutViaUI(page);
    await page.goto(`/professionals/${professional!.id}`);
    await expect(page.getByText("Excellent work, delivered on time.")).toBeVisible();
    await expect(page.getByText(/5\.0 average/)).toBeVisible();
  });
});
