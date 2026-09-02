import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { toApplicationDTO } from "@/lib/mappers";

// Only the owning client can see who applied to their job.
export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("CLIENT");
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) throw new ApiException(404, "Job not found.", "JOB_NOT_FOUND");
  if (job.clientId !== user.id) throw new ApiException(403, "You can only view applications to your own jobs.", "JOB_NOT_OWNER");

  const applications = await prisma.application.findMany({
    where: { jobId: params.id },
    include: { job: { select: { title: true } }, professional: { select: { name: true } } },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ applications: applications.map(toApplicationDTO) });
});
