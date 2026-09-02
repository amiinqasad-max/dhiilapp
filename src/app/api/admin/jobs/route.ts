import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, withErrorHandling } from "@/lib/api-utils";
import { toJobDTO } from "@/lib/mappers";

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireRole("ADMIN");
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim();

  const jobs = await prisma.job.findMany({
    where: status ? { status } : {},
    include: { client: { select: { name: true } }, _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ jobs: jobs.map((j) => toJobDTO(j)) });
});
