import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, withErrorHandling } from "@/lib/api-utils";

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireRole("ADMIN");
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim();

  const verifications = await prisma.verification.findMany({
    where: status ? { status } : {},
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ verifications });
});
