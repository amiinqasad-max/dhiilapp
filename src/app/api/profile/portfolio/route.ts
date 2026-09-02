import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { portfolioItemSchema, parseOrThrow } from "@/lib/validation";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireRole("PROFESSIONAL");
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(portfolioItemSchema, body);

  const profile = await prisma.professionalProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new ApiException(404, "Profile not found.", "PROFILE_NOT_FOUND");

  const item = await prisma.portfolio.create({
    data: {
      professionalProfileId: profile.id,
      title: data.title,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      projectUrl: data.projectUrl || null,
    },
  });

  return NextResponse.json({ portfolio: item }, { status: 201 });
});
