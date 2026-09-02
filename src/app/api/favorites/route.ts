import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";
import { favoriteCreateSchema, parseOrThrow } from "@/lib/validation";
import { toFavoriteDTO } from "@/lib/mappers";
import type { JobStatus } from "@/types";

/** Always the authenticated caller's own favorites — never a userId
 * supplied by the request. Optional ?targetType= filter.
 *
 * Enriches each favorite with a small summary of its target (job title/
 * status/budget, or professional name/title) so the /favorites UI can
 * render a useful list without an API call per row — two batched lookups
 * total (one for all favorited jobs, one for all favorited professionals),
 * never one per favorite. */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType")?.trim();

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id, ...(targetType ? { targetType } : {}) },
    orderBy: { createdAt: "desc" },
  });

  const jobIds = favorites.filter((f) => f.targetType === "JOB").map((f) => f.targetId);
  const professionalUserIds = favorites.filter((f) => f.targetType === "PROFESSIONAL").map((f) => f.targetId);

  const [jobs, professionals] = await Promise.all([
    jobIds.length
      ? prisma.job.findMany({
          where: { id: { in: jobIds } },
          select: { id: true, title: true, status: true, budget: true, category: true },
        })
      : Promise.resolve([]),
    professionalUserIds.length
      ? prisma.professionalProfile.findMany({
          where: { userId: { in: professionalUserIds } },
          select: { userId: true, title: true, user: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);
  const jobById = new Map(jobs.map((j) => [j.id, j]));
  const professionalByUserId = new Map(professionals.map((p) => [p.userId, p]));

  return NextResponse.json({
    favorites: favorites.map((f) => {
      const target =
        f.targetType === "JOB"
          ? jobById.get(f.targetId)
            ? {
              title: jobById.get(f.targetId)!.title,
              status: jobById.get(f.targetId)!.status as JobStatus,
              budget: jobById.get(f.targetId)!.budget,
              category: jobById.get(f.targetId)!.category,
            }
            : null
          : professionalByUserId.get(f.targetId)
          ? { name: professionalByUserId.get(f.targetId)!.user.name, title: professionalByUserId.get(f.targetId)!.title }
          : null;
      return toFavoriteDTO(f, target);
    }),
  });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(favoriteCreateSchema, body);

  // Verify the target actually exists before favoriting it — never trust
  // an arbitrary id from the client to silently create a dangling row.
  if (data.targetType === "JOB") {
    const job = await prisma.job.findUnique({ where: { id: data.targetId }, select: { id: true } });
    if (!job) throw new ApiException(404, "Job not found.", "JOB_NOT_FOUND");
  } else {
    // PROFESSIONAL targetId is the User id (matches the public
    // /professionals/:userId URL — see api/professionals/[id]/route.ts).
    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: data.targetId },
      select: { id: true },
    });
    if (!professional) throw new ApiException(404, "Professional not found.", "PROFESSIONAL_NOT_FOUND");
  }

  const favorite = await prisma.favorite.upsert({
    where: { userId_targetType_targetId: { userId: user.id, targetType: data.targetType, targetId: data.targetId } },
    create: { userId: user.id, targetType: data.targetType, targetId: data.targetId },
    update: {},
  });

  return NextResponse.json({ favorite: toFavoriteDTO(favorite) }, { status: 201 });
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType")?.trim();
  const targetId = searchParams.get("targetId")?.trim();
  if (!targetType || !targetId) {
    throw new ApiException(400, "targetType and targetId are required.", "VALIDATION_ERROR");
  }

  await prisma.favorite.deleteMany({ where: { userId: user.id, targetType, targetId } });
  return NextResponse.json({ ok: true });
});
