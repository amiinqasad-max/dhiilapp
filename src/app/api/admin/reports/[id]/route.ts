import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { parseOrThrow } from "@/lib/validation";

const updateSchema = z.object({
  status: z.enum(["OPEN", "REVIEWED", "DISMISSED", "ACTIONED"]),
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole("ADMIN");
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.");
  const data = parseOrThrow(updateSchema, body);

  const report = await prisma.report.update({ where: { id: params.id }, data: { status: data.status } });
  return NextResponse.json({ report });
});
