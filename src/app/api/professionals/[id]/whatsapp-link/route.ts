import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";
import { generateWhatsAppLink, WhatsAppTemplates } from "@/lib/whatsapp";

// Client -> Professional contact link. Generated server-side so the raw
// phone number never has to round-trip through client-side data — only
// the final wa.me URL (which inherently must carry it) is returned.
export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  await requireUser();

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: params.id },
    include: { user: true },
  });
  if (!profile || !profile.user.isActive) throw new ApiException(404, "Professional not found.");
  if (!profile.user.isWhatsapp) {
    return NextResponse.json({ link: null });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const message = WhatsAppTemplates.professionalContact({
    professionalName: profile.user.name,
    profileUrl: `${appUrl}/professionals/${profile.userId}`,
  });

  const link = generateWhatsAppLink(profile.user.phoneNumber, profile.user.phoneCountry, message);
  return NextResponse.json({ link });
});
