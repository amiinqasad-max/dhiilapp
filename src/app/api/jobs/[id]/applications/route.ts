import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { toApplicationWithApplicantDTO } from "@/lib/mappers";
import type { ApplicantSummary } from "@/types";

// Only the owning client can see who applied to their job. Each applicant
// row is enriched with a summary (title, skills, portfolio count, rating)
// so the client can make an informed shortlist/accept decision without
// visiting each professional's profile individually — loaded via two
// batched queries total for the whole list, never one per applicant.
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

  const professionalIds = Array.from(new Set(applications.map((a) => a.professionalId)));

  const [profiles, reviewAgg] = await Promise.all([
    professionalIds.length
      ? prisma.professionalProfile.findMany({
          where: { userId: { in: professionalIds } },
          select: {
            userId: true,
            title: true,
            skills: { select: { skill: { select: { name: true } } } },
            _count: { select: { portfolio: true } },
          },
        })
      : Promise.resolve([]),
    professionalIds.length
      ? prisma.review.groupBy({
          by: ["revieweeId"],
          where: { revieweeId: { in: professionalIds } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : Promise.resolve([]),
  ]);

  const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));
  const reviewAggByUserId = new Map(reviewAgg.map((r) => [r.revieweeId, r]));

  return NextResponse.json({
    applications: applications.map((app) => {
      const profile = profileByUserId.get(app.professionalId);
      const agg = reviewAggByUserId.get(app.professionalId);
      const summary: ApplicantSummary = {
        title: profile?.title ?? null,
        skills: profile?.skills.map((s) => s.skill.name) ?? [],
        portfolioCount: profile?._count.portfolio ?? 0,
        averageRating: agg?._avg.rating ?? null,
        reviewCount: agg?._count.rating ?? 0,
      };
      return toApplicationWithApplicantDTO(app, summary);
    }),
  });
});
