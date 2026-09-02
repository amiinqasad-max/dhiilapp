import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";
import { toProfessionalProfileDTO } from "@/lib/mappers";

const PAGE_SIZE = 20;

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const skill = searchParams.get("skill")?.trim();
  const location = searchParams.get("location")?.trim();
  const availability = searchParams.get("availability")?.trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  const where: Prisma.ProfessionalProfileWhereInput = {
    user: { isActive: true, role: "PROFESSIONAL" },
  };
  if (location) where.location = { contains: location };
  if (availability) where.availability = availability;
  if (skill) where.skills = { some: { skill: { name: { contains: skill } } } };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { bio: { contains: q } },
      { user: { name: { contains: q } } },
    ];
  }

  const [profiles, total] = await Promise.all([
    prisma.professionalProfile.findMany({
      where,
      include: {
        user: { select: { name: true, isWhatsapp: true, phoneNumber: true } },
        skills: { include: { skill: true } },
        portfolio: true,
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.professionalProfile.count({ where }),
  ]);

  return NextResponse.json({
    professionals: profiles.map(toProfessionalProfileDTO),
    page,
    pageSize: PAGE_SIZE,
    total,
  });
});
