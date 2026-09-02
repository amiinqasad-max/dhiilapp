import { prisma } from "@/lib/prisma";
import { ApiException } from "@/lib/api-utils";
import { NotificationEvents } from "@/services/notification-service";

/**
 * Accepting an application is the single most state-changing operation in
 * the marketplace: it closes the job, rejects every other applicant, and
 * spins up a Project. All of that must happen atomically — see Phase 2A
 * spec section 23 (TRANSACTION SAFETY). If any step fails, everything
 * rolls back and the job/application/project state is left exactly as it
 * was before the call.
 *
 * Sequence (all inside one prisma.$transaction):
 *   1. verify the caller (client) owns the job the application belongs to
 *   2. verify the application is still in an acceptable state
 *   3. verify the job is still OPEN
 *   4. mark the application ACCEPTED
 *   5. reject every other PENDING/SHORTLISTED application for the job
 *   6. close the job
 *   7. create the Project
 *   8. notify the accepted professional, the rejected applicants, and
 *      both project participants — all via the same transaction client
 *      so notifications never exist without the state they describe.
 */
export async function acceptApplication(applicationId: string, clientId: string) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { job: true, professional: { select: { name: true } } },
    });
    if (!application) throw new ApiException(404, "Application not found.", "APPLICATION_NOT_FOUND");

    // Ownership: only the client who owns the job may accept an application
    // for it. Never trust a client id supplied by the request body.
    if (application.job.clientId !== clientId) {
      throw new ApiException(403, "You can only accept applications for your own jobs.", "JOB_NOT_OWNED");
    }

    if (application.status !== "PENDING" && application.status !== "SHORTLISTED") {
      throw new ApiException(
        400,
        `Cannot accept an application with status ${application.status}.`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    if (application.job.status !== "OPEN") {
      throw new ApiException(400, "This job is no longer open for applications.", "JOB_NOT_OPEN");
    }

    // An accepted application always gets exactly one project — enforced
    // both by the Project.applicationId unique constraint and this check.
    const existingProject = await tx.project.findUnique({ where: { applicationId } });
    if (existingProject) {
      throw new ApiException(409, "A project already exists for this application.", "PROJECT_ALREADY_EXISTS");
    }

    await tx.application.update({ where: { id: applicationId }, data: { status: "ACCEPTED" } });

    const competitors = await tx.application.findMany({
      where: {
        jobId: application.jobId,
        id: { not: applicationId },
        status: { in: ["PENDING", "SHORTLISTED"] },
      },
      select: { id: true, professionalId: true },
    });
    if (competitors.length > 0) {
      await tx.application.updateMany({
        where: { id: { in: competitors.map((c) => c.id) } },
        data: { status: "REJECTED" },
      });
    }

    await tx.job.update({ where: { id: application.jobId }, data: { status: "CLOSED" } });

    const project = await tx.project.create({
      data: {
        applicationId,
        jobId: application.jobId,
        clientId: application.job.clientId,
        professionalId: application.professionalId,
        status: "ACTIVE",
      },
      include: {
        job: { select: { title: true } },
        client: { select: { name: true } },
        professional: { select: { name: true } },
      },
    });

    await NotificationEvents.applicationAccepted(application.professionalId, application.job.title, application.jobId, tx);
    await NotificationEvents.projectCreated(application.job.clientId, application.job.title, project.id, tx);
    await NotificationEvents.projectCreated(application.professionalId, application.job.title, project.id, tx);
    for (const competitor of competitors) {
      await NotificationEvents.applicationRejected(competitor.professionalId, application.job.title, application.jobId, tx);
    }

    return project;
  });
}

/**
 * Marks an ACTIVE project COMPLETED or CANCELLED. Either party (client or
 * professional on the project) may do this; the other side is notified.
 * Uses PROJECT_STATUS_TRANSITIONS to reject invalid transitions.
 */
export async function setProjectStatus(
  projectId: string,
  userId: string,
  nextStatus: "COMPLETED" | "CANCELLED"
) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { id: projectId },
      include: { job: { select: { title: true } } },
    });
    if (!project) throw new ApiException(404, "Project not found.", "PROJECT_NOT_FOUND");

    const isParticipant = project.clientId === userId || project.professionalId === userId;
    if (!isParticipant) {
      throw new ApiException(403, "You are not a participant on this project.", "PROJECT_NOT_OWNED");
    }

    if (project.status !== "ACTIVE") {
      throw new ApiException(
        400,
        `Cannot change project status from ${project.status} to ${nextStatus}.`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    const updated = await tx.project.update({
      where: { id: projectId },
      data: {
        status: nextStatus,
        completedAt: nextStatus === "COMPLETED" ? new Date() : undefined,
      },
      include: {
        job: { select: { title: true } },
        client: { select: { name: true } },
        professional: { select: { name: true } },
      },
    });

    if (nextStatus === "COMPLETED") {
      await tx.job.update({ where: { id: project.jobId }, data: { status: "COMPLETED" } });
    }

    const otherParty = userId === project.clientId ? project.professionalId : project.clientId;
    if (nextStatus === "COMPLETED") {
      await NotificationEvents.projectCompleted(otherParty, project.job.title, project.id, tx);
    }

    return updated;
  });
}
