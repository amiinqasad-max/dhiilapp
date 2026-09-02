"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { formatDate } from "@/lib/i18n/format";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { StatusBadge, EmptyState, ErrorState, Skeleton } from "@/components/ui/Misc";
import type { ProjectDTO } from "@/types";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?next=/projects");
      return;
    }
    apiFetch<{ projects: ProjectDTO[] }>("/api/projects")
      .then((d) => setProjects(d.projects))
      .catch((err) => setError(translateApiError(err, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("projects.title")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("projects.subtitle")}</p>

      <div className="mt-5 space-y-2">
        {error && <ErrorState message={error} />}
        {!error && projects === null && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        {!error && projects && projects.length === 0 && (
          <EmptyState title={t("projects.emptyTitle")} description={t("projects.emptyDesc")} />
        )}
        {projects?.map((p) => {
          const other = user?.role === "CLIENT" ? p.professionalName : p.clientName;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-card hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{p.jobTitle}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{other}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-2 text-xs text-gray-400">{t("projects.startedOn", { date: formatDate(p.startedAt, locale) })}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
