"use client";

import { useEffect, useState } from "react";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { ProfessionalCard } from "@/components/marketplace/ProfessionalCard";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/Misc";
import { Input } from "@/components/ui/Field";
import { useTranslation } from "@/context/I18nContext";
import type { ProfessionalProfileDTO } from "@/types";

export default function ProfessionalsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [professionals, setProfessionals] = useState<ProfessionalProfileDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const data = await apiFetch<{ professionals: ProfessionalProfileDTO[] }>(
        `/api/professionals?${params.toString()}`
      );
      setProfessionals(data.professionals);
    } catch (err) {
      setError(translateApiError(err, t));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("professionals.findProfessionalsTitle")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("professionals.findProfessionalsSubtitle")}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setProfessionals(null);
          load();
        }}
        className="sticky top-0 z-10 mt-4 -mx-4 bg-[var(--background)] px-4 py-2 md:static md:mx-0 md:bg-transparent md:px-0"
      >
        <Input
          placeholder={t("professionals.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {professionals === null && !error && Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        {error && <ErrorState message={error} onRetry={load} />}
        {professionals && professionals.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState title={t("professionals.emptyTitle")} description={t("professionals.emptyDesc")} />
          </div>
        )}
        {professionals?.map((p) => <ProfessionalCard key={p.userId} profile={p} />)}
      </div>
    </div>
  );
}
