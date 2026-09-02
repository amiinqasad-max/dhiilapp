import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { parseOrThrow } from "@/lib/validation";

const updateSchema = z.object({
  status: z.enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]),
  notes: z.string().trim().max(1000).optional(),
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole("ADMIN");
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(updateSchema, body);

  const verification = await prisma.verification.update({
    where: { id: params.id },
    data: { status: data.status, ...(data.notes !== undefined ? { notes: data.notes } : {}) },
  });

  return NextResponse.json({ verification });
});
