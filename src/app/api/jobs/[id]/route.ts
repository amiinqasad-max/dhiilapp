import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, getCurrentUser, requireRole, withErrorHandling } from "@/lib/api-utils";
import { jobUpdateSchema, parseOrThrow } from "@/lib/validation";
import { toJobDTO } from "@/lib/mappers";
import { NotificationEvents } from "@/services/notification-service";

export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: { client: { select: { name: true } }, _count: { select: { applications: true } } },
  });
  if (!job) throw new ApiException(404, "Job not found.");

  // A non-OPEN job is visible only to its owner — public search/detail
  // pages should not surface closed/completed jobs to everyone.
  if (job.status !== "OPEN") {
    const current = await getCurrentUser();
    if (!current || current.id !== job.clientId) {
      throw new ApiException(404, "Job not found.");
    }
  }

  return NextResponse.json({ job: toJobDTO(job) });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireRole("CLIENT");
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) throw new ApiException(404, "Job not found.");
  if (job.clientId !== user.id) throw new ApiException(403, "You can only edit your own jobs.");

  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.");
  const data = parseOrThrow(jobUpdateSchema, body);

  const updated = await prisma.job.update({
    where: { id: params.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.budget !== undefined ? { budget: data.budget } : {}),
      ...(data.budgetType !== undefined ? { budgetType: data.budgetType } : {}),
      ...(data.location !== undefined ? { location: data.location || null } : {}),
      ...(data.skills !== undefined ? { skills: data.skills.length > 0 ? data.skills.join(",") : null } : {}),
      ...(data.deadline !== undefined ? { deadline: data.deadline ? new Date(data.deadline) : null } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
    include: { client: { select: { name: true } }, _count: { select: { applications: true } } },
  });

  // Notify professionals with accepted/in-progress applications when the
  // job's status changes (e.g. closed or completed).
  if (data.status && data.status !== job.status) {
    const affected = await prisma.application.findMany({
      where: { jobId: job.id, status: { in: ["ACCEPTED", "PROJECT"] } },
      select: { professionalId: true },
    });
    await Promise.all(
      affected.map((a) => NotificationEvents.jobStatusChanged(a.professionalId, updated.title, job.id, data.status!))
    );
  }

  return NextResponse.json({ job: toJobDTO(updated) });
});

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireRole("CLIENT");
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) throw new ApiException(404, "Job not found.");
  if (job.clientId !== user.id) throw new ApiException(403, "You can only delete your own jobs.");

  await prisma.job.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
});
