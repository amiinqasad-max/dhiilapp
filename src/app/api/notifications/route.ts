import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrorHandling } from "@/lib/api-utils";
import { toNotificationDTO } from "@/lib/mappers";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = await prisma.notification.count({ where: { userId: user.id, isRead: false } });

  return NextResponse.json({
    notifications: notifications.map(toNotificationDTO),
    unreadCount,
  });
});
