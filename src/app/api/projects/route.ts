import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrorHandling } from "@/lib/api-utils";
import { toProjectDTO } from "@/lib/mappers";

/** Always the authenticated caller's own projects — as client or as
 * professional, whichever side they're on. Never a userId supplied by the
 * request. */
export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: { OR: [{ clientId: user.id }, { professionalId: user.id }] },
    include: {
      job: { select: { title: true } },
      client: { select: { name: true } },
      professional: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects: projects.map((p) => toProjectDTO(p)) });
});
