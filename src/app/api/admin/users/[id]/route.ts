import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { parseOrThrow } from "@/lib/validation";

const adminUserUpdateSchema = z.object({
  isActive: z.boolean().optional(),
});

// Admin can suspend/reactivate a user (isActive). Never allow role or
// ownership changes here, and never allow an admin to edit password/email
// through this endpoint.
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  if (admin.id === params.id)
    throw new ApiException(400, "You cannot deactivate your own admin account.", "ADMIN_SELF_DEACTIVATE");

  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(adminUserUpdateSchema, body);

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { ...(data.isActive !== undefined ? { isActive: data.isActive } : {}) },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return NextResponse.json({ user });
});
