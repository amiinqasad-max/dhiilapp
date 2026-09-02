import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { generateWhatsAppLink, WhatsAppTemplates } from "@/lib/whatsapp";

// Professional -> Client contact link about a specific job. Requires the
// professional to have an existing application on this job — DHIIL does
// not hand out a client's WhatsApp number to anyone who merely views a
// public job listing.
export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("PROFESSIONAL");

  const job = await prisma.job.findUnique({ where: { id: params.id }, include: { client: true } });
  if (!job) throw new ApiException(404, "Job not found.");

  const application = await prisma.application.findUnique({
    where: { jobId_professionalId: { jobId: job.id, professionalId: user.id } },
  });
  if (!application) {
    throw new ApiException(403, "Apply to this job before contacting the client on WhatsApp.");
  }

  if (!job.client.isWhatsapp) {
    return NextResponse.json({ link: null });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const message = WhatsAppTemplates.clientContact({
    clientName: job.client.name,
    jobTitle: job.title,
    profileUrl: `${appUrl}/professionals/${user.id}`,
    applicationUrl: `${appUrl}/jobs/${job.id}`,
  });

  const link = generateWhatsAppLink(job.client.phoneNumber, job.client.phoneCountry, message);
  return NextResponse.json({ link });
});
