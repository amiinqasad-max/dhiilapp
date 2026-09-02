import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiException, requireUser, withErrorHandling } from "@/lib/api-utils";

export const PATCH = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const notification = await prisma.notification.findUnique({ where: { id: params.id } });
  if (!notification) throw new ApiException(404, "Notification not found.", "NOTIFICATION_NOT_FOUND");
  if (notification.userId !== user.id)
    throw new ApiException(403, "You can only update your own notifications.", "NOTIFICATION_FORBIDDEN");

  const updated = await prisma.notification.update({ where: { id: params.id }, data: { isRead: true } });
  return NextResponse.json({ notification: updated });
});
