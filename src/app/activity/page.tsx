"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { EmptyState, Skeleton } from "@/components/ui/Misc";
import type { NotificationDTO } from "@/types";

export default function ActivityPage() {
  const { user, loading } = useAuth();
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
      <p className="mt-1 text-sm text-gray-500">Updates on your jobs and applications.</p>

      <div className="mt-4 space-y-2">
        {notifications === null && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {notifications && notifications.length === 0 && (
          <EmptyState title="No activity yet" description="You'll see updates here as things happen on DHIIL." />
        )}
        {notifications?.map((n) => (
          <Link
            key={n.id}
            href={n.link || "#"}
            onClick={() => markRead(n)}
            className={`block rounded-xl border p-3.5 ${n.isRead ? "border-gray-200 bg-white" : "border-brand-200 bg-brand-50"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">{n.title}</p>
              {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
            </div>
            <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
            <p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
