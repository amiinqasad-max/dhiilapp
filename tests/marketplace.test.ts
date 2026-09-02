import { describe, it, expect, beforeAll } from "vitest";
import { makeRequest, captureSession, actAs, actAsGuest, readJson } from "./helpers";
import { prisma } from "@/lib/prisma";

import { POST as registerRoute } from "@/app/api/auth/register/route";
import { POST as jobsCreateRoute } from "@/app/api/jobs/route";
import { PATCH as jobPatchRoute } from "@/app/api/jobs/[id]/route";
import { POST as applyRoute } from "@/app/api/jobs/[id]/apply/route";
import { PATCH as statusRoute } from "@/app/api/applications/[id]/status/route";
import { GET as notificationsRoute } from "@/app/api/notifications/route";
import { GET as projectsListRoute } from "@/app/api/projects/route";
import { GET as projectGetRoute, PATCH as projectPatchRoute } from "@/app/api/projects/[id]/route";
import { GET as projectReviewsRoute, POST as reviewCreateRoute } from "@/app/api/projects/[id]/reviews/route";
import { GET as publicReviewsRoute } from "@/app/api/reviews/route";
import { GET as favoritesListRoute, POST as favoritesCreateRoute, DELETE as favoritesDeleteRoute } from "@/app/api/favorites/route";

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

async function postJob(session: string | undefined, title: string) {
  actAs(session);
  const res = await jobsCreateRoute(
    makeRequest("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        title,
        description: "A detailed description of work that needs to be done for this job.",
        category: "Design",
        budget: 200,
        budgetType: "FIXED",
      }),
    })
  );
  expect(res.status).toBe(201);
  const body = await readJson(res);
  return body.job.id as string;
}

async function apply(session: string | undefined, jobId: string, price = 150) {
  actAs(session);
  const res = await applyRoute(
    makeRequest(`/api/jobs/${jobId}/apply`, {
      method: "POST",
      body: JSON.stringify({
        coverLetter: "A cover letter with enough characters to pass validation checks.",
        proposedPrice: price,
        deliveryTime: "3 days",
      }),
    }),
    { params: { id: jobId } }
  );
  expect(res.status).toBe(201);
  const body = await readJson(res);
  return body.application.id as string;
}

describe("Project / Review / Favorites lifecycle", () => {
  let clientSession: string | undefined;
  let proSession: string | undefined;
  let proId: string;
  let competitorSession: string | undefined;
  let competitorId: string;
  let jobId: string;
  let applicationId: string;
  let competitorApplicationId: string;
  let projectId: string;

  beforeAll(async () => {
    const client = await registerUser("proj-client@test.com", "CLIENT", "Project Client");
    clientSession = client.session;

    const pro = await registerUser("proj-pro@test.com", "PROFESSIONAL", "Project Pro");
    proSession = pro.session;
    proId = pro.userId;

    const competitor = await registerUser("proj-competitor@test.com", "PROFESSIONAL", "Competitor Pro");
    competitorSession = competitor.session;
    competitorId = competitor.userId;

    jobId = await postJob(clientSession, "Build a small marketing website");
    applicationId = await apply(proSession, jobId, 180);
    competitorApplicationId = await apply(competitorSession, jobId, 160);
  });

  it("accepting one application transactionally rejects competitors, closes the job, and creates exactly one project", async () => {
    actAs(clientSession);
    const res = await statusRoute(
      makeRequest(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACCEPTED" }),
      }),
      { params: { id: applicationId } }
    );
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.application.status).toBe("ACCEPTED");
    expect(body.project.status).toBe("ACTIVE");
    expect(body.project.jobId).toBe(jobId);
    projectId = body.project.id;

    // Verify actual database state, not just the response.
    const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.status).toBe("CLOSED");

    const competitorApp = await prisma.application.findUniqueOrThrow({ where: { id: competitorApplicationId } });
    expect(competitorApp.status).toBe("REJECTED");

    const projects = await prisma.project.findMany({ where: { jobId } });
    expect(projects).toHaveLength(1);
    expect(projects[0].applicationId).toBe(applicationId);

    // Competitor was notified of rejection; professional + client both got
    // a PROJECT_CREATED notification.
    actAs(competitorSession);
    const compNotif = await readJson(await notificationsRoute(makeRequest("/api/notifications")));
    expect(compNotif.notifications.some((n: any) => n.type === "APPLICATION_REJECTED")).toBe(true);

    actAs(proSession);
    const proNotif = await readJson(await notificationsRoute(makeRequest("/api/notifications")));
    expect(proNotif.notifications.some((n: any) => n.type === "PROJECT_CREATED")).toBe(true);

    actAs(clientSession);
    const clientNotif = await readJson(await notificationsRoute(makeRequest("/api/notifications")));
    expect(clientNotif.notifications.some((n: any) => n.type === "PROJECT_CREATED")).toBe(true);
  });

  it("accepting an already-non-open job's application rolls back entirely (transaction safety)", async () => {
    // A fresh job/application pair, closed out from under the accept call
    // by directly mutating the DB to simulate a race — the transaction
    // must detect job.status !== OPEN and roll back with no partial state.
    const raceJobId = await postJob(clientSession, "A job that becomes non-open mid-flight");
    const raceApplicationId = await apply(proSession, raceJobId, 100);
    await prisma.job.update({ where: { id: raceJobId }, data: { status: "CANCELLED" } });

    actAs(clientSession);
    const res = await statusRoute(
      makeRequest(`/api/applications/${raceApplicationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACCEPTED" }),
      }),
      { params: { id: raceApplicationId } }
    );
    expect(res.status).toBe(400);

    // Nothing changed: application still PENDING, no project created.
    const app = await prisma.application.findUniqueOrThrow({ where: { id: raceApplicationId } });
    expect(app.status).toBe("PENDING");
    const projects = await prisma.project.findMany({ where: { jobId: raceJobId } });
    expect(projects).toHaveLength(0);
  });

  it("only project participants can view or list the project", async () => {
    actAs(clientSession);
    const listed = await readJson(await projectsListRoute());
    expect(listed.projects.some((p: any) => p.id === projectId)).toBe(true);

    const got = await projectGetRoute(makeRequest(`/api/projects/${projectId}`), { params: { id: projectId } });
    expect(got.status).toBe(200);

    const outsider = await registerUser("proj-outsider@test.com", "CLIENT", "Outsider");
    actAs(outsider.session);
    const denied = await projectGetRoute(makeRequest(`/api/projects/${projectId}`), { params: { id: projectId } });
    expect(denied.status).toBe(404); // not found, not 403 — private data is not even acknowledged to exist
  });

  it("a review cannot be left before the project is completed", async () => {
    actAs(clientSession);
    const res = await reviewCreateRoute(
      makeRequest(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: 5, comment: "Great work!" }),
      }),
      { params: { id: projectId } }
    );
    expect(res.status).toBe(400);
  });

  it("either participant can mark the project completed, which closes the job and notifies the other side", async () => {
    actAs(proSession);
    const res = await projectPatchRoute(
      makeRequest(`/api/projects/${projectId}`, { method: "PATCH", body: JSON.stringify({ status: "COMPLETED" }) }),
      { params: { id: projectId } }
    );
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.project.status).toBe("COMPLETED");

    const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.status).toBe("COMPLETED");

    actAs(clientSession);
    const notif = await readJson(await notificationsRoute(makeRequest("/api/notifications")));
    expect(notif.notifications.some((n: any) => n.type === "PROJECT_COMPLETED")).toBe(true);
  });

  it("a non-participant cannot complete/cancel the project", async () => {
    const outsider = await registerUser("proj-outsider-2@test.com", "PROFESSIONAL", "Outsider Two");
    actAs(outsider.session);
    const res = await projectPatchRoute(
      makeRequest(`/api/projects/${projectId}`, { method: "PATCH", body: JSON.stringify({ status: "CANCELLED" }) }),
      { params: { id: projectId } }
    );
    expect(res.status).toBe(403);
  });

  it("the completed project cannot be completed again (invalid transition)", async () => {
    actAs(clientSession);
    const res = await projectPatchRoute(
      makeRequest(`/api/projects/${projectId}`, { method: "PATCH", body: JSON.stringify({ status: "COMPLETED" }) }),
      { params: { id: projectId } }
    );
    expect(res.status).toBe(400);
  });

  it("client and professional each leave a review; self-review and duplicate review are rejected", async () => {
    actAs(clientSession);
    const clientReview = await reviewCreateRoute(
      makeRequest(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: 5, comment: "Excellent professional, delivered on time." }),
      }),
      { params: { id: projectId } }
    );
    expect(clientReview.status).toBe(201);
    const clientReviewBody = await readJson(clientReview);
    expect(clientReviewBody.review.revieweeId).toBe(proId);

    // Duplicate review by the same reviewer on the same project.
    const dup = await reviewCreateRoute(
      makeRequest(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: 4, comment: "Trying to review again." }),
      }),
      { params: { id: projectId } }
    );
    expect(dup.status).toBe(409);

    actAs(proSession);
    const proReview = await reviewCreateRoute(
      makeRequest(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: 4, comment: "Clear requirements, good client to work with." }),
      }),
      { params: { id: projectId } }
    );
    expect(proReview.status).toBe(201);
    const proReviewBody = await readJson(proReview);
    expect(proReviewBody.review.revieweeId).not.toBe(proId);

    // A non-participant cannot review the project at all.
    const outsider = await registerUser("proj-outsider-3@test.com", "CLIENT", "Outsider Three");
    actAs(outsider.session);
    const outsiderReview = await reviewCreateRoute(
      makeRequest(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: 1, comment: "I was never involved in this project." }),
      }),
      { params: { id: projectId } }
    );
    expect(outsiderReview.status).toBe(403);

    // Both reviews visible to participants on the project...
    actAs(clientSession);
    const list = await readJson(
      await projectReviewsRoute(makeRequest(`/api/projects/${projectId}/reviews`), { params: { id: projectId } })
    );
    expect(list.reviews).toHaveLength(2);

    // ...and the professional's review is publicly visible on their profile.
    actAsGuest();
    const publicList = await readJson(await publicReviewsRoute(makeRequest(`/api/reviews?revieweeId=${proId}`)));
    expect(publicList.reviews.some((r: any) => r.revieweeId === proId)).toBe(true);
  });

  it("favorites: add a job and a professional, list, and remove", async () => {
    const outsider = await registerUser("proj-favoriter@test.com", "CLIENT", "Favoriter");
    actAs(outsider.session);

    const otherJobId = await postJob(clientSession, "Another open job to favorite");

    const addJob = await favoritesCreateRoute(
      makeRequest("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ targetType: "JOB", targetId: otherJobId }),
      })
    );
    expect(addJob.status).toBe(201);

    const addPro = await favoritesCreateRoute(
      makeRequest("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ targetType: "PROFESSIONAL", targetId: proId }),
      })
    );
    expect(addPro.status).toBe(201);

    // Re-adding the same favorite is idempotent, not a duplicate row.
    const addJobAgain = await favoritesCreateRoute(
      makeRequest("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ targetType: "JOB", targetId: otherJobId }),
      })
    );
    expect(addJobAgain.status).toBe(201);

    const list = await readJson(await favoritesListRoute(makeRequest("/api/favorites")));
    expect(list.favorites).toHaveLength(2);

    const del = await favoritesDeleteRoute(
      makeRequest(`/api/favorites?targetType=JOB&targetId=${otherJobId}`, { method: "DELETE" })
    );
    expect(del.status).toBe(200);

    const listAfter = await readJson(await favoritesListRoute(makeRequest("/api/favorites")));
    expect(listAfter.favorites).toHaveLength(1);
  });

  it("favoriting a non-existent job is rejected", async () => {
    actAs(clientSession);
    const res = await favoritesCreateRoute(
      makeRequest("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ targetType: "JOB", targetId: "00000000-0000-0000-0000-000000000000" }),
      })
    );
    expect(res.status).toBe(404);
  });

  it("a client can PATCH a non-OPEN job status only through valid transitions", async () => {
    const openJobId = await postJob(clientSession, "Job for status machine testing");
    actAs(clientSession);
    const toPaused = await jobPatchRoute(
      makeRequest(`/api/jobs/${openJobId}`, { method: "PATCH", body: JSON.stringify({ status: "PAUSED" }) }),
      { params: { id: openJobId } }
    );
    expect(toPaused.status).toBe(200);

    // PAUSED -> COMPLETED is not a directly settable transition (system-driven only).
    const invalid = await jobPatchRoute(
      makeRequest(`/api/jobs/${openJobId}`, { method: "PATCH", body: JSON.stringify({ status: "COMPLETED" }) }),
      { params: { id: openJobId } }
    );
    expect(invalid.status).toBe(400);
  });
});
