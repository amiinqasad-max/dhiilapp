import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

/**
 * The auth cookie is `Secure` in production (see login/register routes) —
 * Chromium treats http://127.0.0.1 as a trustworthy origin for normal page
 * navigation, so the browser itself keeps sending it fine, but Playwright's
 * `page.request` API context enforces the Secure flag strictly and drops
 * it. Reading the cookie value and attaching it as an explicit header on
 * API-only requests (used to assert 401/403 responses, not to drive the
 * UI) works around that without loosening the cookie's real security.
 */
export async function authHeader(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name === "dhiil_session");
  return session ? { Cookie: `dhiil_session=${session.value}` } : {};
}

export interface Actor {
  name: string;
  email: string;
  password: string;
}

/** Registers a new account through the real registration form and waits
 * for the post-register redirect (client -> /jobs/new, professional ->
 * /profile), confirming the browser actually completed the flow. */
export async function registerViaUI(page: Page, role: "CLIENT" | "PROFESSIONAL", actor: Actor) {
  await page.goto("/register");
  await page.getByRole("button", { name: role === "CLIENT" ? "I'm a Client" : "I'm a Professional" }).click();
  await page.getByLabel("Full Name").fill(actor.name);
  await page.getByLabel("Email").fill(actor.email);
  await page.getByLabel("Password").fill(actor.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(role === "CLIENT" ? /\/jobs\/new/ : /\/profile/, { timeout: 15_000 });
}

export async function loginViaUI(page: Page, actor: Pick<Actor, "email" | "password">) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(actor.email);
  await page.getByLabel("Password").fill(actor.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

export async function logoutViaUI(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  // Wait for the logout API call + auth-state refresh to actually land
  // before the caller navigates again — otherwise a subsequent action can
  // race against a still-authenticated cookie/session state. The navbar's
  // logged-out state renders "Log in" as a link, not a button.
  await expect(page.getByRole("link", { name: "Log in" }).first()).toBeVisible({ timeout: 10_000 });
}

/** Fills and saves the client-side WhatsApp contact fields on /profile
 * (shared by both roles) so later WhatsApp-link assertions have a real
 * number to work with. Explicit isWhatsapp opt-in, never inferred from
 * the phone number alone — mirrors the real form fields. */
export async function setWhatsAppNumber(page: Page, phoneCountry: string, phoneNumber: string) {
  await page.goto("/profile");
  await page.getByLabel("Country").fill(phoneCountry);
  await page.getByLabel("Phone number").fill(phoneNumber);
  await page.getByLabel("This number is on WhatsApp").check();
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
}

export async function fillProfessionalProfile(
  page: Page,
  opts: { title: string; bio: string; hourlyRate: string; skills: string }
) {
  await page.goto("/profile");
  await page.getByLabel("Professional title").fill(opts.title);
  await page.getByLabel("Bio").fill(opts.bio);
  await page.getByLabel("Hourly rate (USD)").fill(opts.hourlyRate);
  await page.getByLabel("Skills").fill(opts.skills);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
}

export async function addPortfolioItem(page: Page, title: string, description: string) {
  await page.goto("/profile");
  await page.getByLabel("Project title").fill(title);
  await page.getByLabel("Description", { exact: true }).fill(description);
  await page.getByRole("button", { name: "Add to portfolio" }).click();
  await expect(page.getByText("Added to your portfolio.")).toBeVisible();
}

export interface JobInput {
  title: string;
  description: string;
  category: string;
  budget: string;
}

/** Posts a job via the real form. DHIIL publishes immediately on create
 * (no separate draft/publish step exists in the UI — see
 * prisma/schema.prisma's Job.status comment) so "publish" here is the
 * single Publish job submit. */
export async function postJobViaUI(page: Page, job: JobInput) {
  await page.goto("/jobs/new");
  await page.getByLabel("Job title").fill(job.title);
  await page.getByLabel("Description", { exact: true }).fill(job.description);
  await page.getByLabel("Category").fill(job.category);
  await page.getByLabel("Budget (USD)").fill(job.budget);
  await page.getByRole("button", { name: "Publish job" }).click();
  await expect(page.getByRole("heading", { name: "Job Published" })).toBeVisible({ timeout: 15_000 });
}

export async function applyToJobViaUI(
  page: Page,
  jobTitle: string,
  opts: { coverLetter: string; proposedPrice: string; deliveryTime: string }
) {
  await page.goto("/jobs");
  await page.getByRole("link", { name: new RegExp(jobTitle) }).first().click();
  await page.getByRole("link", { name: "Apply Now" }).click();
  await page.getByLabel("Cover letter").fill(opts.coverLetter);
  await page.getByLabel("Proposed price (USD)").fill(opts.proposedPrice);
  await page.getByLabel("Delivery time").fill(opts.deliveryTime);
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("heading", { name: "Application Ready" })).toBeVisible({ timeout: 15_000 });
}
