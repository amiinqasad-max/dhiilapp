import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { portfolioItemSchema, parseOrThrow } from "@/lib/validation";

async function assertOwnership(userId: string, portfolioId: string) {
  const item = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: { professionalProfile: true },
  });
  if (!item) throw new ApiException(404, "Portfolio item not found.");
  if (item.professionalProfile.userId !== userId) {
    throw new ApiException(403, "You can only modify your own portfolio.");
  }
  return item;
}

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireRole("PROFESSIONAL");
  await assertOwnership(user.id, params.id);
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.");
  const data = parseOrThrow(portfolioItemSchema.partial(), body);

  const updated = await prisma.portfolio.update({
    where: { id: params.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
      ...(data.projectUrl !== undefined ? { projectUrl: data.projectUrl || null } : {}),
    },
  });

  return NextResponse.json({ portfolio: updated });
});

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireRole("PROFESSIONAL");
  await assertOwnership(user.id, params.id);
  await prisma.portfolio.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
});
