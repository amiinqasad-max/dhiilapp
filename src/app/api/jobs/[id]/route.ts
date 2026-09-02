import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, getCurrentUser, requireRole, withErrorHandling } from "@/lib/api-utils";
import { jobUpdateSchema, parseOrThrow } from "@/lib/validation";
import { toJobDTO } from "@/lib/mappers";
import { NotificationEvents } from "@/services/notification-service";
import { JOB_STATUS_TRANSITIONS, type JobStatus } from "@/types";

export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: { client: { select: { name: true } }, _count: { select: { applications: true } } },
  });
  if (!job) throw new ApiException(404, "Job not found.", "JOB_NOT_FOUND");

  // A non-OPEN job is visible only to its owner — public search/detail
  // pages should not surface closed/completed jobs to everyone.
  if (job.status !== "OPEN") {
    const current = await getCurrentUser();
    if (!current || current.id !== job.clientId) {
      throw new ApiException(404, "Job not found.", "JOB_NOT_FOUND");
    }
  }

  return NextResponse.json({ job: toJobDTO(job) });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireRole("CLIENT");
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) throw new ApiException(404, "Job not found.", "JOB_NOT_FOUND");
  if (job.clientId !== user.id) throw new ApiException(403, "You can only edit your own jobs.", "JOB_NOT_OWNER");

  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(jobUpdateSchema, body);

  // Server-side status machine — CLOSED (reached via application accept)
  // and COMPLETED (reached via project completion) are system-driven and
  // not directly settable here; see JOB_STATUS_TRANSITIONS.
  if (data.status !== undefined && data.status !== job.status) {
    const allowed = JOB_STATUS_TRANSITIONS[job.status] || [];
    if (!allowed.includes(data.status as JobStatus)) {
      throw new ApiException(
        400,
        `Cannot change job status from ${job.status} to ${data.status}.`,
        "INVALID_STATUS_TRANSITION"
      );
    }
  }

  const updated = await prisma.job.update({
    where: { id: params.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.budget !== undefined ? { budget: data.budget } : {}),
      ...(data.budgetType !== undefined ? { budgetType: data.budgetType } : {}),
      ...(data.jobType !== undefined ? { jobType: data.jobType } : {}),
      ...(data.remote !== undefined ? { remote: data.remote } : {}),
      ...(data.location !== undefined ? { location: data.location || null } : {}),
      ...(data.skills !== undefined ? { skills: data.skills.length > 0 ? data.skills.join(",") : null } : {}),
      ...(data.deadline !== undefined ? { deadline: data.deadline ? new Date(data.deadline) : null } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
    include: { client: { select: { name: true } }, _count: { select: { applications: true } } },
  });

  // Notify the professional with the active project on this job (if any)
  // when the job's status changes (e.g. paused, cancelled).
  if (data.status && data.status !== job.status) {
    const project = await prisma.project.findFirst({
      where: { jobId: job.id, status: "ACTIVE" },
      select: { professionalId: true },
    });
    if (project) {
      await NotificationEvents.jobStatusChanged(project.professionalId, updated.title, job.id, data.status);
    }
  }

  return NextResponse.json({ job: toJobDTO(updated) });
});

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireRole("CLIENT");
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) throw new ApiException(404, "Job not found.", "JOB_NOT_FOUND");
  if (job.clientId !== user.id) throw new ApiException(403, "You can only delete your own jobs.", "JOB_NOT_OWNER");

  await prisma.job.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
});
