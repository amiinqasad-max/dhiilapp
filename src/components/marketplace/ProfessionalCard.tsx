"use client";

import Link from "next/link";
import { useTranslation } from "@/context/I18nContext";
import { formatCurrency } from "@/lib/i18n/format";
import type { Availability, ProfessionalProfileDTO } from "@/types";

const availabilityKeys: Record<Availability, string> = {
  AVAILABLE: "professionals.availableStatus",
  BUSY: "professionals.busyStatus",
  UNAVAILABLE: "professionals.unavailableStatus",
};

export function ProfessionalCard({ profile }: { profile: ProfessionalProfileDTO }) {
  const { t, locale } = useTranslation();
  return (
    <Link
      href={`/professionals/${profile.userId}`}
      className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-card transition-shadow hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-lg font-bold text-brand-700">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            profile.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{profile.name}</p>
          <p className="truncate text-xs text-gray-500">{profile.title || t("professionals.professionalOnDhiil")}</p>
        </div>
        {profile.hourlyRate != null && (
          <span className="shrink-0 text-sm font-semibold text-brand-700">
            {formatCurrency(profile.hourlyRate, locale)}
            {t("jobs.budgetHourlySuffix")}
          </span>
        )}
      </div>
      {profile.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
        {profile.location && <span>{profile.location}</span>}
        <span>{t(availabilityKeys[profile.availability])}</span>
      </div>
    </Link>
  );
}
