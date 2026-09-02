import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";
import { applicationStatusSchema, parseOrThrow } from "@/lib/validation";
import { toApplicationDTO } from "@/lib/mappers";
import { NotificationEvents } from "@/services/notification-service";
import { acceptApplication } from "@/services/project-service";
import { toProjectDTO } from "@/lib/mappers";
import {
  CLIENT_APPLICATION_TRANSITIONS,
  PROFESSIONAL_APPLICATION_TRANSITIONS,
  type ApplicationStatus,
} from "@/types";

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { job: true, professional: { select: { name: true } } },
  });
  if (!application) throw new ApiException(404, "Application not found.", "APPLICATION_NOT_FOUND");

  const isClientOwner = user.role === "CLIENT" && application.job.clientId === user.id;
  const isProfessionalOwner = user.role === "PROFESSIONAL" && application.professionalId === user.id;
  if (!isClientOwner && !isProfessionalOwner) {
    throw new ApiException(403, "You do not have permission to update this application.", "APPLICATION_FORBIDDEN");
  }

  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const { status: nextStatus } = parseOrThrow(applicationStatusSchema, body);

  const allowed = isClientOwner
    ? CLIENT_APPLICATION_TRANSITIONS[application.status] || []
    : PROFESSIONAL_APPLICATION_TRANSITIONS[application.status] || [];

  if (!allowed.includes(nextStatus as ApplicationStatus)) {
    throw new ApiException(
      400,
      `Cannot change application status from ${application.status} to ${nextStatus}.`,
      "INVALID_STATUS_TRANSITION"
    );
  }

  // ACCEPTED is not a plain field update — it closes the job, rejects
  // every competing application, and creates a Project, all atomically.
  // See src/services/project-service.ts.
  if (nextStatus === "ACCEPTED") {
    const project = await acceptApplication(params.id, user.id);
    const updated = await prisma.application.findUniqueOrThrow({
      where: { id: params.id },
      include: { job: { select: { title: true } }, professional: { select: { name: true } } },
    });
    return NextResponse.json({ application: toApplicationDTO(updated), project: toProjectDTO(project) });
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { status: nextStatus },
    include: { job: { select: { title: true } }, professional: { select: { name: true } } },
  });

  switch (nextStatus) {
    case "SHORTLISTED":
      await NotificationEvents.applicationShortlisted(application.professionalId, application.job.title, application.jobId);
      break;
    case "REJECTED":
      await NotificationEvents.applicationRejected(application.professionalId, application.job.title, application.jobId);
      break;
    case "WITHDRAWN":
      await NotificationEvents.applicationWithdrawn(
        application.job.clientId,
        application.job.title,
        application.jobId,
        application.professional.name
      );
      break;
    default:
      break;
  }

  return NextResponse.json({ application: toApplicationDTO(updated) });
});
