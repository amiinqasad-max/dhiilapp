import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";

// Records that the professional clicked "Continue on WhatsApp" for this
// application. This is metadata about a click only — it is NOT proof the
// message was sent, delivered, or read, and must never be presented as such.
export const POST = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application) throw new ApiException(404, "Application not found.");
  if (application.professionalId !== user.id) {
    throw new ApiException(403, "You can only update your own applications.");
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { whatsappContactedAt: new Date() },
  });

  return NextResponse.json({ whatsappContactedAt: updated.whatsappContactedAt });
});
