import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, withErrorHandling } from "@/lib/api-utils";

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireRole("ADMIN");
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role")?.trim();

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ users });
});
