import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, withErrorHandling } from "@/lib/api-utils";

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireRole("ADMIN");
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim();

  const reports = await prisma.report.findMany({
    where: status ? { status } : {},
    include: { author: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ reports });
});
