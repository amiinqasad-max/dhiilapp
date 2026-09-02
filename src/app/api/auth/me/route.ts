import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";

export const GET = withErrorHandling(async () => {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ user: null }, { status: 200 });

  const user = await prisma.user.findUnique({ where: { id: current.id } });
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phoneCountry: user.phoneCountry,
      phoneNumber: user.phoneNumber,
      isWhatsapp: user.isWhatsapp,
      createdAt: user.createdAt.toISOString(),
    },
  });
});
