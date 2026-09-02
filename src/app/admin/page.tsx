"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { Card, ErrorState, Skeleton } from "@/components/ui/Misc";

interface Stats {
  totalUsers: number;
  totalClients: number;
  totalProfessionals: number;
  totalJobs: number;
  openJobs: number;
  totalApplications: number;
  openReports: number;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login?next=/admin");
      return;
    }
    if (user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    apiFetch<Stats>("/api/admin/stats")
      .then(setStats)
      .catch((err) => setError(translateApiError(err, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, router]);

  if (loading || (!user && !error)) {
    return <div className="mx-auto max-w-5xl px-4 py-6"><Skeleton className="h-40 w-full" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("admin.title")}</h1>
      <nav className="mt-3 flex gap-4 text-sm font-medium text-brand-700">
        <Link href="/admin/users">{t("admin.navUsers")}</Link>
        <Link href="/admin/jobs">{t("admin.navJobs")}</Link>
        <Link href="/admin/reports">{t("admin.navReports")}</Link>
      </nav>

      {error && <div className="mt-4"><ErrorState message={error} /></div>}

      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="text-center"><p className="text-2xl font-bold">{stats.totalUsers}</p><p className="text-xs text-gray-500">{t("admin.statUsers")}</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.totalClients}</p><p className="text-xs text-gray-500">{t("admin.statClients")}</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.totalProfessionals}</p><p className="text-xs text-gray-500">{t("admin.statProfessionals")}</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.openReports}</p><p className="text-xs text-gray-500">{t("admin.statOpenReports")}</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.totalJobs}</p><p className="text-xs text-gray-500">{t("admin.statTotalJobs")}</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.openJobs}</p><p className="text-xs text-gray-500">{t("admin.statOpenJobs")}</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.totalApplications}</p><p className="text-xs text-gray-500">{t("admin.statApplications")}</p></Card>
        </div>
      )}
    </div>
  );
}
