import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { applicationCreateSchema, parseOrThrow } from "@/lib/validation";
import { toApplicationDTO } from "@/lib/mappers";
import { NotificationEvents } from "@/services/notification-service";
import { generateWhatsAppLink, WhatsAppTemplates } from "@/lib/whatsapp";

// Professional applies to a job. Application is saved to the database
// FIRST, a notification is created for the client, and only then is a
// WhatsApp continuation link generated and returned — WhatsApp never
// replaces the database record.
export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireRole("PROFESSIONAL");

  const job = await prisma.job.findUnique({ where: { id: params.id }, include: { client: true } });
  if (!job) throw new ApiException(404, "Job not found.");
  if (job.status !== "OPEN") throw new ApiException(400, "This job is no longer accepting applications.");
  if (job.clientId === user.id) throw new ApiException(400, "You cannot apply to your own job.");

  const existing = await prisma.application.findUnique({
    where: { jobId_professionalId: { jobId: job.id, professionalId: user.id } },
  });
  if (existing) throw new ApiException(409, "You have already applied to this job.");

  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.");
  const data = parseOrThrow(applicationCreateSchema, body);

  if (data.portfolioId) {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: data.portfolioId },
      include: { professionalProfile: true },
    });
    if (!portfolio || portfolio.professionalProfile.userId !== user.id) {
      throw new ApiException(400, "Invalid portfolio selection.");
    }
  }

  // 1. Save the application — DHIIL's record of the marketplace activity.
  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      professionalId: user.id,
      coverLetter: data.coverLetter,
      proposedPrice: data.proposedPrice,
      deliveryTime: data.deliveryTime,
      portfolioId: data.portfolioId || null,
    },
    include: { job: { select: { title: true } }, professional: { select: { name: true } } },
  });

  // 2. Notify the client inside DHIIL.
  await NotificationEvents.newApplication(job.clientId, job.title, job.id, user.name);

  // 3. Generate (but do not send) a WhatsApp continuation link.
  let waLink: string | null = null;
  if (job.client.isWhatsapp) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    let portfolioUrl: string | undefined;
    if (data.portfolioId) {
      const portfolio = await prisma.portfolio.findUnique({ where: { id: data.portfolioId } });
      portfolioUrl = portfolio?.projectUrl || undefined;
    }
    const message = WhatsAppTemplates.application({
      jobTitle: job.title,
      category: job.category,
      professionalName: user.name,
      skills: job.skills ? job.skills.split(",").filter(Boolean) : [],
      proposedPrice: data.proposedPrice,
      deliveryTime: data.deliveryTime,
      coverLetter: data.coverLetter,
      portfolioUrl,
      applicationUrl: `${appUrl}/jobs/${job.id}`,
    });
    waLink = generateWhatsAppLink(job.client.phoneNumber, job.client.phoneCountry, message);
  }

  return NextResponse.json(
    { application: toApplicationDTO(application), whatsappLink: waLink },
    { status: 201 }
  );
});
