import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";
import { profileUpdateSchema, parseOrThrow } from "@/lib/validation";
import { toProfessionalProfileDTO } from "@/lib/mappers";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  if (user.role !== "PROFESSIONAL") {
    const full = await prisma.user.findUnique({ where: { id: user.id } });
    return NextResponse.json({ profile: null, user: full });
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { name: true, isWhatsapp: true, phoneNumber: true } },
      skills: { include: { skill: true } },
      portfolio: true,
    },
  });
  if (!profile) throw new ApiException(404, "Profile not found.", "PROFILE_NOT_FOUND");

  return NextResponse.json({ profile: toProfessionalProfileDTO(profile) });
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(profileUpdateSchema, body);

  // Fields that live on User apply to every role.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phoneCountry !== undefined ? { phoneCountry: data.phoneCountry || null } : {}),
      ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber || null } : {}),
      ...(data.isWhatsapp !== undefined ? { isWhatsapp: data.isWhatsapp } : {}),
    },
  });

  if (user.role !== "PROFESSIONAL") {
    return NextResponse.json({ ok: true });
  }

  const profile = await prisma.professionalProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new ApiException(404, "Profile not found.", "PROFILE_NOT_FOUND");

  if (data.skills) {
    // Upsert skills by name, then re-link exactly this set to the profile.
    const skillRecords = await Promise.all(
      data.skills.map((name) =>
        prisma.skill.upsert({ where: { name }, update: {}, create: { name } })
      )
    );
    await prisma.professionalSkill.deleteMany({ where: { professionalProfileId: profile.id } });
    // De-duplicate by skill id (SQLite's createMany has no skipDuplicates support).
    const uniqueSkillIds = Array.from(new Set(skillRecords.map((s) => s.id)));
    await prisma.professionalSkill.createMany({
      data: uniqueSkillIds.map((skillId) => ({ professionalProfileId: profile.id, skillId })),
    });
  }

  const updated = await prisma.professionalProfile.update({
    where: { id: profile.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.hourlyRate !== undefined ? { hourlyRate: data.hourlyRate } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.languages !== undefined ? { languages: data.languages.join(",") } : {}),
      ...(data.availability !== undefined ? { availability: data.availability } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl || null } : {}),
    },
    include: {
      user: { select: { name: true, isWhatsapp: true, phoneNumber: true } },
      skills: { include: { skill: true } },
      portfolio: true,
    },
  });

  // Mark profile complete once the essentials are filled in.
  const isComplete = Boolean(updated.title && updated.bio && updated.skills.length > 0);
  if (isComplete !== updated.profileComplete) {
    await prisma.professionalProfile.update({ where: { id: profile.id }, data: { profileComplete: isComplete } });
  }

  return NextResponse.json({ profile: toProfessionalProfileDTO({ ...updated, profileComplete: isComplete }) });
});
