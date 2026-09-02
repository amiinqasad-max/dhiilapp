import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrorHandling } from "@/lib/api-utils";

// A professional requests verification of their identity/credentials.
// Admin decides the outcome via /api/admin/verifications/:id.
export const POST = withErrorHandling(async () => {
  const user = await requireUser();

  const verification = await prisma.verification.upsert({
    where: { userId: user.id },
    update: { status: "PENDING" },
    create: { userId: user.id, status: "PENDING" },
  });

  return NextResponse.json({ verification });
});

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const verification = await prisma.verification.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ verification });
});
