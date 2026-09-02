import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";
import { reviewCreateSchema, parseOrThrow } from "@/lib/validation";
import { toReviewDTO } from "@/lib/mappers";
import { createReview } from "@/services/review-service";

/** Reviews on a project are visible only to its two participants — the
 * project itself is private, so its reviews are too (public review
 * browsing happens via GET /api/reviews?revieweeId=, which only surfaces
 * reviews about a public professional profile). */
export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) throw new ApiException(404, "Project not found.", "PROJECT_NOT_FOUND");
  if (project.clientId !== user.id && project.professionalId !== user.id) {
    throw new ApiException(404, "Project not found.", "PROJECT_NOT_FOUND");
  }

  const reviews = await prisma.review.findMany({
    where: { projectId: params.id },
    include: { reviewer: { select: { name: true } }, reviewee: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews: reviews.map((r) => toReviewDTO(r)) });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(reviewCreateSchema, body);

  const review = await createReview(params.id, user.id, data.rating, data.comment);
  return NextResponse.json({ review: toReviewDTO(review) }, { status: 201 });
});
