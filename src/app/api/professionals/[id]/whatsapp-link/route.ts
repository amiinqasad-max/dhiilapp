import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";
import { generateDhiilWhatsAppLink, WhatsAppTemplates } from "@/lib/whatsapp";
import { getServerLocale } from "@/lib/i18n/server";

// Client -> Professional contact link. Generated server-side so the raw
// phone number never has to round-trip through client-side data — only
// the final wa.me URL (which inherently must carry it) is returned.
export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  await requireUser();

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: params.id },
    include: { user: true },
  });
  if (!profile || !profile.user.isActive) throw new ApiException(404, "Professional not found.", "PROFESSIONAL_NOT_FOUND");

  // Routed to DHIIL's own WhatsApp number rather than the professional's
  // personal number, so every skiller contact request is relayed through
  // DHIIL.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const message = WhatsAppTemplates.professionalContact(
    {
      professionalName: profile.user.name,
      profileUrl: `${appUrl}/professionals/${profile.userId}`,
    },
    getServerLocale()
  );

  const link = generateDhiilWhatsAppLink(message);
  return NextResponse.json({ link });
});
