"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiClientError } from "@/lib/api-client";
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
  const router = useRouter();
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<{ reports: AdminReport[] }>("/api/admin/reports");
      setReports(data.reports);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load reports.");
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
      toast("Report updated.");
      load();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Failed to update report.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/admin" className="text-sm text-brand-700">← Admin</Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Reports</h1>

      {error && <div className="mt-4"><ErrorState message={error} onRetry={load} /></div>}

      <div className="mt-4 space-y-2">
        {reports === null && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        {reports && reports.length === 0 && <p className="text-sm text-gray-500">No reports.</p>}
        {reports?.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {r.targetType} · {r.targetId}
                </p>
                <p className="text-xs text-gray-500">Reported by {r.author.name} ({r.author.email})</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-2 text-sm text-gray-600">{r.reason}</p>
            {r.status === "OPEN" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" loading={busyId === r.id} onClick={() => setStatus(r.id, "ACTIONED")}>
                  Mark actioned
                </Button>
                <Button size="sm" variant="outline" loading={busyId === r.id} onClick={() => setStatus(r.id, "DISMISSED")}>
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
