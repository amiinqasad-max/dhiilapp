import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, withErrorHandling } from "@/lib/api-utils";

export const GET = withErrorHandling(async () => {
  await requireRole("ADMIN");

  const [totalUsers, totalClients, totalProfessionals, totalJobs, openJobs, totalApplications, openReports] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.user.count({ where: { role: "PROFESSIONAL" } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.application.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
    ]);

  return NextResponse.json({
    totalUsers,
    totalClients,
    totalProfessionals,
    totalJobs,
    openJobs,
    totalApplications,
    openReports,
  });
});
