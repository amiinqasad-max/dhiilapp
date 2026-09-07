import { describe, it, expect, beforeAll } from "vitest";
import { makeRequest, captureSession, actAs, actAsGuest, readJson } from "./helpers";

import { POST as registerRoute } from "@/app/api/auth/register/route";
import { GET as meRoute } from "@/app/api/auth/me/route";
import { POST as jobsCreateRoute, GET as jobsListRoute } from "@/app/api/jobs/route";
import { GET as jobGetRoute, PATCH as jobPatchRoute } from "@/app/api/jobs/[id]/route";
import { POST as applyRoute } from "@/app/api/jobs/[id]/apply/route";
import { GET as jobApplicationsRoute } from "@/app/api/jobs/[id]/applications/route";
import { GET as applicationsListRoute } from "@/app/api/applications/route";
import { PATCH as statusRoute } from "@/app/api/applications/[id]/status/route";
import { GET as notificationsRoute } from "@/app/api/notifications/route";
import { PATCH as profileRoute } from "@/app/api/profile/route";

async function registerUser(email: string, role: "CLIENT" | "PROFESSIONAL", name: string) {
  actAsGuest();
  const res = await registerRoute(
    makeRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: "password123", name, role }),
    })
  );
  expect(res.status).toBe(201);
  const body = await readJson(res);
  const session = captureSession();
  return { userId: body.user.id as string, session };
}

describe("DHIIL end-to-end marketplace flow", () => {
  let clientSession: string | undefined;
  let clientId: string;
  let proSession: string | undefined;
  let proId: string;
  let jobId: string;
  let applicationId: string;

  beforeAll(async () => {
    const client = await registerUser("e2e-client@test.com", "CLIENT", "E2E Client");
    clientSession = client.session;
    clientId = client.userId;

    // Give the client a WhatsApp-capable number so link generation is exercised.
    actAs(clientSession);
    await profileRoute(
      makeRequest("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ phoneCountry: "US", phoneNumber: "2025550123", isWhatsapp: true }),
      })
    );

    const pro = await registerUser("e2e-pro@test.com", "PROFESSIONAL", "E2E Professional");
    proSession = pro.session;
    proId = pro.userId;
  });

  it("registration rejects a duplicate email", async () => {
    actAsGuest();
    const res = await registerRoute(
      makeRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "e2e-client@test.com",
          password: "password123",
          name: "Someone else",
          role: "CLIENT",
        }),
      })
    );
    expect(res.status).toBe(409);
  });

  it("/api/auth/me reflects the logged-in user and null when logged out", async () => {
    actAs(clientSession);
    const res = await meRoute();
    const body = await readJson(res);
    expect(body.user.email).toBe("e2e-client@test.com");

    actAsGuest();
    const res2 = await meRoute();
    const body2 = await readJson(res2);
    expect(body2.user).toBeNull();
  });

  it("unauthenticated request to a protected route is rejected", async () => {
    actAsGuest();
    const res = await jobsCreateRoute(
      makeRequest("/api/jobs", {
        method: "POST",
        body: JSON.stringify({ title: "x", description: "x", category: "x", budget: 1 }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("client posts a job", async () => {
    actAs(clientSession);
    const res = await jobsCreateRoute(
      makeRequest("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: "Design a logo for my bakery",
          description: "Need a clean modern logo design for a new bakery brand.",
          category: "Design",
          budget: 150,
          budgetType: "FIXED",
          skills: ["Illustrator", "Branding"],
        }),
      })
    );
    expect(res.status).toBe(201);
    const body = await readJson(res);
    expect(body.job.status).toBe("OPEN");
    jobId = body.job.id;
  });

  it("a professional cannot post a job (role authorization)", async () => {
    actAs(proSession);
    const res = await jobsCreateRoute(
      makeRequest("/api/jobs", {
        method: "POST",
        body: JSON.stringify({ title: "x".repeat(10), description: "x".repeat(30), category: "x", budget: 1 }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("the published job is publicly visible and searchable", async () => {
    actAsGuest();
    const res = await jobsListRoute(makeRequest("/api/jobs"));
    const body = await readJson(res);
    expect(body.jobs.some((j: any) => j.id === jobId)).toBe(true);

    const detail = await jobGetRoute(makeRequest(`/api/jobs/${jobId}`), { params: { id: jobId } });
    expect(detail.status).toBe(200);
  });

  it("a client cannot edit another client's job (ownership)", async () => {
    const other = await registerUser("e2e-client-2@test.com", "CLIENT", "Other Client");
    actAs(other.session);
    const res = await jobPatchRoute(
      makeRequest(`/api/jobs/${jobId}`, { method: "PATCH", body: JSON.stringify({ title: "hacked" }) }),
      { params: { id: jobId } }
    );
    expect(res.status).toBe(403);
  });

  it("professional applies to the job — application saved, notification created, WhatsApp link generated", async () => {
    actAs(proSession);
    const res = await applyRoute(
      makeRequest(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        body: JSON.stringify({
          coverLetter: "I would love to design your bakery logo, 5 years experience.",
          proposedPrice: 140,
          deliveryTime: "3 days",
        }),
      }),
      { params: { id: jobId } }
    );
    expect(res.status).toBe(201);
    const body = await readJson(res);
    expect(body.application.status).toBe("PENDING");
    applicationId = body.application.id;

    // WhatsApp link is routed to DHIIL's own number (not the client's
    // personal one), is fully URL-encoded, carries the job title +
    // application URL, and never claims delivery.
    expect(body.whatsappLink).toMatch(/^https:\/\/wa\.me\/251915253029\?text=/);
    const decoded = decodeURIComponent(body.whatsappLink.split("?text=")[1]);
    expect(decoded).toContain("Design a logo for my bakery");
    expect(decoded).toContain(`/jobs/${jobId}`);
    expect(decoded.toLowerCase()).not.toContain("message sent");

    // Client was notified inside DHIIL (the database, not WhatsApp, is the
    // source of truth for this event).
    actAs(clientSession);
    const notifRes = await notificationsRoute(makeRequest("/api/notifications"));
    const notifBody = await readJson(notifRes);
    expect(notifBody.notifications.some((n: any) => n.type === "APPLICATION_RECEIVED")).toBe(true);
  });

  it("professional cannot apply twice to the same job (duplicate prevention)", async () => {
    actAs(proSession);
    const res = await applyRoute(
      makeRequest(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        body: JSON.stringify({
          coverLetter: "Trying to apply again with different text content here.",
          proposedPrice: 100,
          deliveryTime: "2 days",
        }),
      }),
      { params: { id: jobId } }
    );
    expect(res.status).toBe(409);
  });

  it("a client cannot apply to jobs (role authorization) and cannot apply to their own job", async () => {
    actAs(clientSession);
    const res = await applyRoute(
      makeRequest(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        body: JSON.stringify({
          coverLetter: "Client trying to apply to their own job for some reason.",
          proposedPrice: 100,
          deliveryTime: "2 days",
        }),
      }),
      { params: { id: jobId } }
    );
    expect(res.status).toBe(403); // blocked by role check before self-apply check
  });

  it("a client cannot view another client's applications (ownership)", async () => {
    const other = await registerUser("e2e-client-3@test.com", "CLIENT", "Yet Another Client");
    actAs(other.session);
    const res = await jobApplicationsRoute(makeRequest(`/api/jobs/${jobId}/applications`), {
      params: { id: jobId },
    });
    expect(res.status).toBe(403);
  });

  it("client shortlists then accepts the application; professional is notified at each step", async () => {
    actAs(clientSession);
    const shortlist = await statusRoute(
      makeRequest(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "SHORTLISTED" }),
      }),
      { params: { id: applicationId } }
    );
    expect(shortlist.status).toBe(200);

    const accept = await statusRoute(
      makeRequest(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACCEPTED" }),
      }),
      { params: { id: applicationId } }
    );
    expect(accept.status).toBe(200);
    const acceptBody = await readJson(accept);
    expect(acceptBody.application.status).toBe("ACCEPTED");

    actAs(proSession);
    const notifRes = await notificationsRoute(makeRequest("/api/notifications"));
    const notifBody = await readJson(notifRes);
    const types = notifBody.notifications.map((n: any) => n.type);
    expect(types).toContain("APPLICATION_SHORTLISTED");
    expect(types).toContain("APPLICATION_ACCEPTED");
  });

  it("professional cannot perform client-only status transitions", async () => {
    actAs(proSession);
    const res = await statusRoute(
      makeRequest(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "REJECTED" }),
      }),
      { params: { id: applicationId } }
    );
    expect(res.status).toBe(400); // ACCEPTED has no professional-side transition to REJECTED
  });

  it("a closed job stops accepting applications", async () => {
    actAs(clientSession);
    const close = await jobPatchRoute(
      makeRequest(`/api/jobs/${jobId}`, { method: "PATCH", body: JSON.stringify({ status: "CLOSED" }) }),
      { params: { id: jobId } }
    );
    expect(close.status).toBe(200);

    const otherPro = await registerUser("e2e-pro-2@test.com", "PROFESSIONAL", "Other Pro");
    actAs(otherPro.session);
    const applyRes = await applyRoute(
      makeRequest(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        body: JSON.stringify({
          coverLetter: "Applying to a job that should now be closed for testing.",
          proposedPrice: 50,
          deliveryTime: "1 day",
        }),
      }),
      { params: { id: jobId } }
    );
    expect(applyRes.status).toBe(400);
  });

  it("professional sees their own applications via /api/applications", async () => {
    actAs(proSession);
    const res = await applicationsListRoute(makeRequest("/api/applications"));
    const body = await readJson(res);
    expect(body.applications.some((a: any) => a.id === applicationId)).toBe(true);
  });
});
