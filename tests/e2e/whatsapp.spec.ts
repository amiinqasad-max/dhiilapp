import { test, expect, uniqueEmail } from "./fixtures";
import { registerViaUI, postJobViaUI, setWhatsAppNumber, logoutViaUI } from "./helpers";

// Verifies the WhatsApp CTA end to end through the real UI: job
// applications and professional-contact requests are routed to DHIIL's
// own WhatsApp number (not the other party's personal number), correct
// URL structure, localized template — and, critically, that nothing is
// ever actually sent. We only ever read the generated `href`; we never
// click through to wa.me (that would try to leave the page for a real
// external site).
test.describe("WhatsApp integration (link generation only, never sends)", () => {
  test("a client with isWhatsapp enabled produces a correctly structured share link", async ({ page }) => {
    const clientEmail = uniqueEmail("wa-client");
    const jobTitle = `E2E WhatsApp Job ${Date.now()}`;

    await registerViaUI(page, "CLIENT", { name: "WhatsApp Client", email: clientEmail, password: "password123" });
    await setWhatsAppNumber(page, "US", "2025550123");
    await postJobViaUI(page, {
      title: jobTitle,
      description: "Verifying the WhatsApp share link structure without ever sending anything.",
      category: "Design",
      budget: "180",
    });

    const shareLink = page.getByRole("link", { name: "Share on WhatsApp" });
    await expect(shareLink).toBeVisible();
    const href = await shareLink.getAttribute("href");
    expect(href).not.toBeNull();
    // Share links have no fixed recipient — wa.me/?text=... — never claim
    // a specific number was messaged.
    expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
    const decoded = decodeURIComponent(href!.split("?text=")[1]);
    expect(decoded).toContain(jobTitle);
    expect(decoded.toLowerCase()).not.toContain("message sent");
    expect(decoded.toLowerCase()).not.toContain("delivered");
    // The anchor opens a new tab rather than navigating away in place —
    // confirms the button never silently "sends" from inside DHIIL.
    await expect(shareLink).toHaveAttribute("target", "_blank");
  });

  test("professional applying to a job gets a WhatsApp link addressed to DHIIL, not the client", async ({
    page,
  }) => {
    const clientEmail = uniqueEmail("wa-client-2");
    const proEmail = uniqueEmail("wa-pro");
    const jobTitle = `E2E WhatsApp Apply Job ${Date.now()}`;

    await registerViaUI(page, "CLIENT", { name: "WA Job Owner", email: clientEmail, password: "password123" });
    await postJobViaUI(page, {
      title: jobTitle,
      description: "Job used to verify the professional's post-apply WhatsApp CTA is correctly addressed.",
      category: "Development",
      budget: "260",
    });
    await logoutViaUI(page);

    await registerViaUI(page, "PROFESSIONAL", { name: "WA Applicant", email: proEmail, password: "password123" });
    await page.goto(`/jobs`);
    await page.getByRole("link", { name: new RegExp(jobTitle) }).first().click();
    await page.getByRole("link", { name: "Apply Now" }).click();
    await page.getByLabel("Cover letter").fill("Applying to verify the WhatsApp continue link is correct.");
    await page.getByLabel("Proposed price (USD)").fill("240");
    await page.getByLabel("Delivery time").fill("3 days");
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByRole("heading", { name: "Application Ready" })).toBeVisible();

    const continueLink = page.getByRole("link", { name: /Continue on WhatsApp/ });
    await expect(continueLink).toBeVisible();
    const href = await continueLink.getAttribute("href");
    // Routed to DHIIL's own WhatsApp number, never the client's personal one.
    expect(href).toMatch(/^https:\/\/wa\.me\/251915253029\?text=/);
    const decoded = decodeURIComponent(href!.split("?text=")[1]);
    expect(decoded).toContain(jobTitle);
    expect(decoded.toLowerCase()).not.toContain("message sent");
    expect(decoded.toLowerCase()).not.toContain("delivered");
    expect(decoded.toLowerCase()).not.toContain("read");
  });

  test("contacting a professional works even without their own isWhatsapp enabled — routed to DHIIL", async ({
    page,
  }) => {
    const clientEmail = uniqueEmail("wa-client-3");
    const proEmail = uniqueEmail("wa-pro-2");

    await registerViaUI(page, "PROFESSIONAL", { name: "No WhatsApp Pro", email: proEmail, password: "password123" });
    // Deliberately leave isWhatsapp unset on the professional's own
    // profile — the contact link no longer depends on it, since it's
    // routed to DHIIL's own number rather than the professional's.
    await page.goto("/profile");
    await page.getByLabel("Phone number").fill("2025550188");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile saved.")).toBeVisible();
    await logoutViaUI(page);

    await registerViaUI(page, "CLIENT", { name: "WA Visitor Client", email: clientEmail, password: "password123" });
    await page.goto("/professionals");
    await page.getByRole("link", { name: "No WhatsApp Pro" }).click();
    const contactLink = page.getByRole("link", { name: /Contact.*WhatsApp/i });
    await expect(contactLink).toBeVisible();
    const href = await contactLink.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/251915253029\?text=/);
  });
});
