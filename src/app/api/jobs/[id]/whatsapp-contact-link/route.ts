import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { generateDhiilWhatsAppLink, WhatsAppTemplates } from "@/lib/whatsapp";
import { getServerLocale } from "@/lib/i18n/server";

// Professional -> Client contact link about a specific job. Requires the
// professional to have an existing application on this job — DHIIL does
// not hand out a client's WhatsApp number to anyone who merely views a
// public job listing.
export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("PROFESSIONAL");

  const job = await prisma.job.findUnique({ where: { id: params.id }, include: { client: true } });
  if (!job) throw new ApiException(404, "Job not found.", "JOB_NOT_FOUND");

  const application = await prisma.application.findUnique({
    where: { jobId_professionalId: { jobId: job.id, professionalId: user.id } },
  });
  if (!application) {
    throw new ApiException(403, "Apply to this job before contacting the client on WhatsApp.", "MUST_APPLY_FIRST");
  }

  // Routed to DHIIL's own WhatsApp number rather than the client's
  // personal number, so every request is relayed through DHIIL.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const message = WhatsAppTemplates.clientContact(
    {
      clientName: job.client.name,
      jobTitle: job.title,
      profileUrl: `${appUrl}/professionals/${user.id}`,
      applicationUrl: `${appUrl}/jobs/${job.id}`,
    },
    getServerLocale()
  );

  const link = generateDhiilWhatsAppLink(message);
  return NextResponse.json({ link });
});
