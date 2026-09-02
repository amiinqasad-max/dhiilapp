"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { Skeleton, ErrorState, StatusBadge, toast } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import type { JobDTO } from "@/types";

export default function AdminJobsPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<{ jobs: JobDTO[] }>("/api/admin/jobs");
      setJobs(data.jobs);
    } catch (err) {
      setError(translateApiError(err, t));
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!user) return router.push("/login?next=/admin/jobs");
    if (user.role !== "ADMIN") return router.push("/");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  async function closeJob(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/jobs/${id}`, { method: "PATCH", body: JSON.stringify({ status: "CLOSED" }) });
      toast(t("admin.jobClosedToast"));
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
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{t("admin.jobsTitle")}</h1>

      {error && <div className="mt-4"><ErrorState message={error} onRetry={load} /></div>}

      <div className="mt-4 space-y-2">
        {jobs === null && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {jobs?.map((job) => (
          <div key={job.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5">
            <div className="min-w-0">
              <Link href={`/jobs/${job.id}`} className="truncate text-sm font-medium text-gray-900 hover:underline">
                {job.title}
              </Link>
              <p className="text-xs text-gray-500">
                {job.clientName} · {t("jobs.applicantsCount", { count: job.applicationCount })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={job.status} />
              {job.status === "OPEN" && (
                <Button size="sm" variant="danger" loading={busyId === job.id} onClick={() => closeJob(job.id)}>
                  {t("admin.closeButton")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
