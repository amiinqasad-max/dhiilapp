import { test, expect, uniqueEmail } from "./fixtures";
import { registerViaUI, postJobViaUI, fillProfessionalProfile, addPortfolioItem, applyToJobViaUI, loginViaUI } from "./helpers";
import { db } from "./db";

test.describe("Professional: register -> profile -> skills -> portfolio -> browse -> apply", () => {
  test("a real professional can build a profile and apply to a real job", async ({ page }) => {
    const clientEmail = uniqueEmail("client-for-pro");
    const proEmail = uniqueEmail("pro");
    const jobTitle = `E2E Pro-flow Job ${Date.now()}`;

    // Seed a real OPEN job through the browser, as a separate client actor.
    await registerViaUI(page, "CLIENT", { name: "E2E Job Owner", email: clientEmail, password: "password123" });
    await postJobViaUI(page, {
      title: jobTitle,
      description: "Looking for a professional to complete this end-to-end test task for us.",
      category: "Development",
      budget: "400",
    });
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page.getByRole("link", { name: "Log in" }).first()).toBeVisible({ timeout: 10_000 });

    await registerViaUI(page, "PROFESSIONAL", { name: "E2E Professional", email: proEmail, password: "password123" });

    await fillProfessionalProfile(page, {
      title: "End-to-End Test Engineer",
      bio: "I write real browser tests for a living.",
      hourlyRate: "35",
      skills: "Playwright, Testing, QA",
    });
    await addPortfolioItem(page, "DHIIL E2E suite", "Built the Playwright coverage for DHIIL.");

    // Browse -> open -> apply, entirely through the rendered marketplace.
    await applyToJobViaUI(page, jobTitle, {
      coverLetter: "I have deep experience with exactly this kind of work and would love to help.",
      proposedPrice: "380",
      deliveryTime: "4 days",
    });

    // Verify the actual database, not just the success screen.
    const professional = await db.user.findUnique({ where: { email: proEmail } });
    const job = await db.job.findFirst({ where: { title: jobTitle } });
    const application = await db.application.findFirst({
      where: { professionalId: professional!.id, jobId: job!.id },
    });
    expect(application).not.toBeNull();
    expect(application?.status).toBe("PENDING");
    expect(application?.proposedPrice).toBe(380);

    const profile = await db.professionalProfile.findUnique({ where: { userId: professional!.id } });
    expect(profile?.title).toBe("End-to-End Test Engineer");
    const skills = await db.professionalSkill.findMany({
      where: { professionalProfileId: profile!.id },
      include: { skill: true },
    });
    expect(skills.map((s) => s.skill.name)).toEqual(expect.arrayContaining(["Playwright", "Testing", "QA"]));
    const portfolio = await db.portfolio.findFirst({ where: { professionalProfileId: profile!.id } });
    expect(portfolio?.title).toBe("DHIIL E2E suite");

    // Applying twice is rejected — both by the UI's own duplicate-apply
    // guard and, if that's bypassed, by the server.
    await loginViaUI(page, { email: proEmail, password: "password123" });
    await page.goto(`/jobs/${job!.id}`);
    await expect(page.getByRole("button", { name: "Applied" })).toBeVisible();
  });
});
