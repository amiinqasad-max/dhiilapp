"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { formatDateTime } from "@/lib/i18n/format";
import { apiFetch } from "@/lib/api-client";
import { EmptyState, Skeleton } from "@/components/ui/Misc";
import type { NotificationDTO, NotificationType } from "@/types";

const notificationKeys: Record<NotificationType, { title: string; message: string }> = {
  APPLICATION_RECEIVED: { title: "notifications.newApplicationTitle", message: "notifications.newApplicationMessage" },
  APPLICATION_SHORTLISTED: { title: "notifications.shortlistedTitle", message: "notifications.shortlistedMessage" },
  APPLICATION_ACCEPTED: { title: "notifications.acceptedTitle", message: "notifications.acceptedMessage" },
  APPLICATION_REJECTED: { title: "notifications.rejectedTitle", message: "notifications.rejectedMessage" },
  APPLICATION_WITHDRAWN: { title: "notifications.withdrawnTitle", message: "notifications.withdrawnMessage" },
  JOB_STATUS_CHANGED: { title: "notifications.jobStatusChangedTitle", message: "notifications.jobStatusChangedMessage" },
  PROJECT_CREATED: { title: "notifications.projectCreatedTitle", message: "notifications.projectCreatedMessage" },
  PROJECT_COMPLETED: { title: "notifications.projectCompletedTitle", message: "notifications.projectCompletedMessage" },
  REVIEW_RECEIVED: { title: "notifications.reviewReceivedTitle", message: "notifications.reviewReceivedMessage" },
};

const jobStatusKey: Record<string, string> = {
  OPEN: "jobs.statusOpen",
  CLOSED: "jobs.statusClosed",
  COMPLETED: "jobs.statusCompleted",
};

export default function ActivityPage() {
  const { user, loading } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDTO[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login?next=/activity");
      return;
    }
    apiFetch<{ notifications: NotificationDTO[] }>("/api/notifications").then((d) => setNotifications(d.notifications));
  }, [loading, user, router]);

  async function markRead(n: NotificationDTO) {
    if (n.isRead) return;
    setNotifications((prev) => prev?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) ?? prev);
    apiFetch(`/api/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {});
  }

  function render(n: NotificationDTO) {
    const keys = notificationKeys[n.type];
    if (!keys) return { title: n.title, message: n.message };
    const meta = n.meta || {};
    const status = meta.status && jobStatusKey[meta.status] ? t(jobStatusKey[meta.status]) : meta.status;
    return {
      title: t(keys.title),
      message: t(keys.message, { job: meta.jobTitle || "", name: meta.professionalName || "", status: status || "" }),
    };
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("notifications.title")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("notifications.subtitle")}</p>

      <div className="mt-4 space-y-2">
        {notifications === null && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {notifications && notifications.length === 0 && (
          <EmptyState title={t("notifications.emptyTitle")} description={t("notifications.emptyDesc")} />
        )}
        {notifications?.map((n) => {
          const { title, message } = render(n);
          return (
            <Link
              key={n.id}
              href={n.link || "#"}
              onClick={() => markRead(n)}
              className={`block rounded-xl border p-3.5 ${n.isRead ? "border-gray-200 bg-white" : "border-brand-200 bg-brand-50"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
              </div>
              <p className="mt-0.5 text-sm text-gray-600">{message}</p>
              <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.createdAt, locale)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
