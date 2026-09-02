import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";
import { projectStatusSchema, parseOrThrow } from "@/lib/validation";
import { toProjectDTO } from "@/lib/mappers";
import { setProjectStatus } from "@/services/project-service";

export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      job: { select: { title: true } },
      client: { select: { name: true } },
      professional: { select: { name: true } },
    },
  });
  if (!project) throw new ApiException(404, "Project not found.", "PROJECT_NOT_FOUND");
  if (project.clientId !== user.id && project.professionalId !== user.id) {
    // A project is private to its two participants — not searchable or
    // browsable by anyone else, unlike a public job listing.
    throw new ApiException(404, "Project not found.", "PROJECT_NOT_FOUND");
  }

  return NextResponse.json({ project: toProjectDTO(project) });
});

/** Either participant may mark the project COMPLETED or CANCELLED — ACTIVE
 * is only ever reached via acceptApplication(), never set directly here. */
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const { status } = parseOrThrow(projectStatusSchema, body);

  if (status !== "COMPLETED" && status !== "CANCELLED") {
    throw new ApiException(400, `Cannot set project status to ${status} directly.`, "INVALID_STATUS_TRANSITION");
  }

  const updated = await setProjectStatus(params.id, user.id, status);
  return NextResponse.json({ project: toProjectDTO(updated) });
});
