"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { Skeleton, ErrorState, StatusBadge, toast } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";

interface AdminReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  author: { name: string; email: string };
}

export default function AdminReportsPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<{ reports: AdminReport[] }>("/api/admin/reports");
      setReports(data.reports);
    } catch (err) {
      setError(translateApiError(err, t));
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!user) return router.push("/login?next=/admin/reports");
    if (user.role !== "ADMIN") return router.push("/");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast(t("admin.reportUpdated"));
      load();
    } catch (err) {
      toast(translateApiError(err, t), "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/admin" className="text-sm text-brand-700">{t("admin.backToAdmin")}</Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{t("admin.reportsTitle")}</h1>

      {error && <div className="mt-4"><ErrorState message={error} onRetry={load} /></div>}

      <div className="mt-4 space-y-2">
        {reports === null && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        {reports && reports.length === 0 && <p className="text-sm text-gray-500">{t("admin.noReports")}</p>}
        {reports?.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {r.targetType} · {r.targetId}
                </p>
                <p className="text-xs text-gray-500">{t("admin.reportedBy", { name: r.author.name, email: r.author.email })}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-2 text-sm text-gray-600">{r.reason}</p>
            {r.status === "OPEN" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" loading={busyId === r.id} onClick={() => setStatus(r.id, "ACTIONED")}>
                  {t("admin.markActioned")}
                </Button>
                <Button size="sm" variant="outline" loading={busyId === r.id} onClick={() => setStatus(r.id, "DISMISSED")}>
                  {t("admin.dismiss")}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
