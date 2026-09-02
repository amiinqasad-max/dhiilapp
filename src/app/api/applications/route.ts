import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ApiException, withErrorHandling } from "@/lib/api-utils";
import { toApplicationDTO } from "@/lib/mappers";

// Role-aware: professionals see their own applications; clients see all
// applications across jobs they own. Identity + role always come from the
// verified session — never from a query param.
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim();

  if (user.role === "PROFESSIONAL") {
    const applications = await prisma.application.findMany({
      where: { professionalId: user.id, ...(status ? { status } : {}) },
      include: { job: { select: { title: true } }, professional: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
    });
    return NextResponse.json({ applications: applications.map(toApplicationDTO) });
  }

  if (user.role === "CLIENT") {
    const applications = await prisma.application.findMany({
      where: { job: { clientId: user.id }, ...(status ? { status } : {}) },
      include: { job: { select: { title: true } }, professional: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
    });
    return NextResponse.json({ applications: applications.map(toApplicationDTO) });
  }

  throw new ApiException(403, "You do not have permission to view applications.");
});
