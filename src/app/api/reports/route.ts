import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";
import { parseOrThrow } from "@/lib/validation";

const reportSchema = z.object({
  targetType: z.enum(["USER", "JOB"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(10).max(1000),
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(reportSchema, body);

  const report = await prisma.report.create({
    data: { authorId: user.id, targetType: data.targetType, targetId: data.targetId, reason: data.reason },
  });

  return NextResponse.json({ report }, { status: 201 });
});
