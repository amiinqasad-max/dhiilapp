import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, withErrorHandling } from "@/lib/api-utils";
import { toReviewDTO } from "@/lib/mappers";

/** Public: the reviews left about a given user (typically a professional's
 * profile page). Read-only, no auth required — a review is public once it
 * exists, same as a public professional profile or job listing. */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const revieweeId = searchParams.get("revieweeId")?.trim();
  if (!revieweeId) throw new ApiException(400, "revieweeId is required.", "VALIDATION_ERROR");

  const reviews = await prisma.review.findMany({
    where: { revieweeId },
    include: { reviewer: { select: { name: true } }, reviewee: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews: reviews.map((r) => toReviewDTO(r)) });
});
