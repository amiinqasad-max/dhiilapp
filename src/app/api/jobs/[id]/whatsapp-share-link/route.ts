import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireRole, withErrorHandling } from "@/lib/api-utils";
import { generateWhatsAppShareLink, WhatsAppTemplates } from "@/lib/whatsapp";
import { getServerLocale } from "@/lib/i18n/server";

// Client shares their own published job to WhatsApp contacts/groups. No
// fixed recipient — opens WhatsApp's own picker.
export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("CLIENT");
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) throw new ApiException(404, "Job not found.", "JOB_NOT_FOUND");
  if (job.clientId !== user.id) throw new ApiException(403, "You can only share your own jobs.", "CANNOT_SHARE_OTHERS_JOB");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const message = WhatsAppTemplates.jobShare(
    {
      jobTitle: job.title,
      category: job.category,
      budget: `$${job.budget.toLocaleString()}${job.budgetType === "HOURLY" ? "/hr" : ""}`,
      location: job.location,
      shortDescription: job.description.slice(0, 220),
      skills: job.skills ? job.skills.split(",").filter(Boolean) : [],
      jobUrl: `${appUrl}/jobs/${job.id}`,
    },
    getServerLocale()
  );

  return NextResponse.json({ link: generateWhatsAppShareLink(message) });
});
