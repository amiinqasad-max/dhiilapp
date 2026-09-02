import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";
import { parseOrThrow, reportCreateSchema } from "@/lib/validation";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(reportCreateSchema, body);

  const report = await prisma.report.create({
    data: { authorId: user.id, targetType: data.targetType, targetId: data.targetId, reason: data.reason },
  });

  return NextResponse.json({ report }, { status: 201 });
});
