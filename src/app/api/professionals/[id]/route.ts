import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, withErrorHandling } from "@/lib/api-utils";
import { toProfessionalProfileDTO } from "@/lib/mappers";

// [id] is the User id of the professional (not the profile id) — this is
// the id that appears in public URLs (/professionals/:userId).
export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: params.id },
    include: {
      user: { select: { name: true, isWhatsapp: true, phoneNumber: true, isActive: true, role: true } },
      skills: { include: { skill: true } },
      portfolio: true,
    },
  });

  if (!profile || !profile.user.isActive || profile.user.role !== "PROFESSIONAL") {
    throw new ApiException(404, "Professional not found.");
  }

  return NextResponse.json({ professional: toProfessionalProfileDTO(profile) });
});
