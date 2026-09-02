"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiClientError } from "@/lib/api-client";
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
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load stats."));
  }, [loading, user, router]);

  if (loading || (!user && !error)) {
    return <div className="mx-auto max-w-5xl px-4 py-6"><Skeleton className="h-40 w-full" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
      <nav className="mt-3 flex gap-4 text-sm font-medium text-brand-700">
        <Link href="/admin/users">Users</Link>
        <Link href="/admin/jobs">Jobs</Link>
        <Link href="/admin/reports">Reports</Link>
      </nav>

      {error && <div className="mt-4"><ErrorState message={error} /></div>}

      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="text-center"><p className="text-2xl font-bold">{stats.totalUsers}</p><p className="text-xs text-gray-500">Users</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.totalClients}</p><p className="text-xs text-gray-500">Clients</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.totalProfessionals}</p><p className="text-xs text-gray-500">Professionals</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.openReports}</p><p className="text-xs text-gray-500">Open reports</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.totalJobs}</p><p className="text-xs text-gray-500">Total jobs</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.openJobs}</p><p className="text-xs text-gray-500">Open jobs</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold">{stats.totalApplications}</p><p className="text-xs text-gray-500">Applications</p></Card>
        </div>
      )}
    </div>
  );
}
