"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { formatCurrency } from "@/lib/i18n/format";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { StatusBadge, EmptyState, ErrorState, Skeleton, toast } from "@/components/ui/Misc";
import { LinkButton } from "@/components/ui/Button";
import type { FavoriteDTO, FavoriteJobSummary, FavoriteProfessionalSummary } from "@/types";
import type { Locale } from "@/lib/i18n/config";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const targetType = user?.role === "CLIENT" ? "PROFESSIONAL" : "JOB";

  async function load() {
    setError(null);
    try {
      const data = await apiFetch<{ favorites: FavoriteDTO[] }>(`/api/favorites?targetType=${targetType}`);
      setFavorites(data.favorites);
    } catch (err) {
      setError(translateApiError(err, t));
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?next=/favorites");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function remove(fav: FavoriteDTO) {
    setRemovingId(fav.id);
    const previous = favorites;
    // Optimistic — with a real rollback if the server call fails.
    setFavorites((prev) => prev?.filter((f) => f.id !== fav.id) ?? prev);
    try {
      await apiFetch(`/api/favorites?targetType=${fav.targetType}&targetId=${fav.targetId}`, { method: "DELETE" });
      toast(t(fav.targetType === "JOB" ? "favorites.removedJobToast" : "favorites.removedProfessionalToast"));
    } catch (err) {
      setFavorites(previous);
      toast(translateApiError(err, t), "error");
    } finally {
      setRemovingId(null);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {user.role === "CLIENT" ? t("favorites.savedProfessionalsTitle") : t("favorites.savedJobsTitle")}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {user.role === "CLIENT" ? t("favorites.savedProfessionalsSubtitle") : t("favorites.savedJobsSubtitle")}
      </p>

      <div className="mt-5 space-y-2">
        {error && <ErrorState message={error} onRetry={load} />}
        {!error && favorites === null && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        {!error && favorites && favorites.length === 0 && (
          <EmptyState
            title={t(user.role === "CLIENT" ? "favorites.emptyProfessionalsTitle" : "favorites.emptyJobsTitle")}
            description={t(user.role === "CLIENT" ? "favorites.emptyProfessionalsDesc" : "favorites.emptyJobsDesc")}
            action={
              <LinkButton href={user.role === "CLIENT" ? "/professionals" : "/jobs"}>
                {t(user.role === "CLIENT" ? "professionals.findProfessionalsTitle" : "jobs.findJobsTitle")}
              </LinkButton>
            }
          />
        )}
        {favorites?.map((fav) => (
          <div key={fav.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
            {fav.target ? (
              <Link
                href={fav.targetType === "JOB" ? `/jobs/${fav.targetId}` : `/professionals/${fav.targetId}`}
                className="min-w-0 flex-1"
              >
                {fav.targetType === "JOB" ? (
                  <JobSummaryRow summary={fav.target as FavoriteJobSummary} locale={locale} />
                ) : (
                  <ProfessionalSummaryRow summary={fav.target as FavoriteProfessionalSummary} />
                )}
              </Link>
            ) : (
              <p className="min-w-0 flex-1 text-sm text-gray-400">{t("favorites.targetGoneLabel")}</p>
            )}
            <button
              type="button"
              onClick={() => remove(fav)}
              disabled={removingId === fav.id}
              aria-label={t("common.remove")}
              className="tap-target shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {t("common.remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function JobSummaryRow({ summary, locale }: { summary: FavoriteJobSummary; locale: Locale }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{summary.title}</p>
        <p className="text-xs text-gray-500">
          {formatCurrency(summary.budget, locale)} · {summary.category}
        </p>
      </div>
      <StatusBadge status={summary.status} />
    </div>
  );
}

function ProfessionalSummaryRow({ summary }: { summary: FavoriteProfessionalSummary }) {
  return (
    <div>
      <p className="truncate text-sm font-semibold text-gray-900">{summary.name}</p>
      {summary.title && <p className="text-xs text-gray-500">{summary.title}</p>}
    </div>
  );
}
