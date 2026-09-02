import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { parseOrThrow } from "@/lib/validation";
import { toJobDTO } from "@/lib/mappers";

const moderateSchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "COMPLETED"]),
});

// Moderation: admin can close a job (e.g. policy violation) but cannot
// rewrite its content — content edits stay the owning client's action.
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole("ADMIN");
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.");
  const data = parseOrThrow(moderateSchema, body);

  const job = await prisma.job.update({
    where: { id: params.id },
    data: { status: data.status },
    include: { client: { select: { name: true } }, _count: { select: { applications: true } } },
  });

  return NextResponse.json({ job: toJobDTO(job) });
});
