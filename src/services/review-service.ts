import { prisma } from "@/lib/prisma";
import { ApiException } from "@/lib/api-utils";
import { NotificationEvents } from "@/services/notification-service";

/**
 * A review may only be left by a project participant, about the other
 * participant, only once the project is COMPLETED, never about yourself,
 * and never more than once per project per reviewer (also enforced by the
 * Review.@@unique([projectId, reviewerId]) constraint — this check exists
 * to return a clean ALREADY_REVIEWED error instead of a raw DB conflict).
 */
export async function createReview(
  projectId: string,
  reviewerId: string,
  rating: number,
  comment: string | undefined
) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { id: projectId },
      include: { job: { select: { title: true } } },
    });
    if (!project) throw new ApiException(404, "Project not found.", "PROJECT_NOT_FOUND");

    const isClient = project.clientId === reviewerId;
    const isProfessional = project.professionalId === reviewerId;
    if (!isClient && !isProfessional) {
      throw new ApiException(403, "You are not a participant on this project.", "PROJECT_NOT_OWNED");
    }

    if (project.status !== "COMPLETED") {
      throw new ApiException(400, "You can only review a project once it's completed.", "REVIEW_NOT_ALLOWED");
    }

    const revieweeId = isClient ? project.professionalId : project.clientId;
    if (revieweeId === reviewerId) {
      // Unreachable given the participant check above (client !== professional
      // on a valid project), but guards against any future data shape change.
      throw new ApiException(400, "You cannot review yourself.", "REVIEW_NOT_ALLOWED");
    }

    const existing = await tx.review.findUnique({
      where: { projectId_reviewerId: { projectId, reviewerId } },
    });
    if (existing) {
      throw new ApiException(409, "You have already reviewed this project.", "REVIEW_NOT_ALLOWED");
    }

    const review = await tx.review.create({
      data: { projectId, reviewerId, revieweeId, rating, comment: comment || null },
      include: { reviewer: { select: { name: true } }, reviewee: { select: { name: true } } },
    });

    await NotificationEvents.reviewReceived(revieweeId, review.reviewer?.name ?? "", projectId, tx);

    return review;
  });
}
