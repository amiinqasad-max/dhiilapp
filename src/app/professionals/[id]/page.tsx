"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { WhatsAppButton } from "@/components/marketplace/WhatsAppButton";
import { FavoriteButton } from "@/components/marketplace/FavoriteButton";
import { ErrorState, Skeleton, EmptyState } from "@/components/ui/Misc";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { formatCurrency, formatDate } from "@/lib/i18n/format";
import type { Availability, ProfessionalProfileDTO, ReviewDTO } from "@/types";

const availabilityKeys: Record<Availability, string> = {
  AVAILABLE: "professionals.availableStatus",
  BUSY: "professionals.busyStatus",
  UNAVAILABLE: "professionals.unavailableStatus",
};

export default function ProfessionalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const [profile, setProfile] = useState<ProfessionalProfileDTO | null>(null);
  const [reviews, setReviews] = useState<ReviewDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ professional: ProfessionalProfileDTO }>(`/api/professionals/${id}`)
      .then((data) => setProfile(data.professional))
      .catch((err) => setError(translateApiError(err, t)));
    apiFetch<{ reviews: ReviewDTO[] }>(`/api/reviews?revieweeId=${id}`)
      .then((data) => setReviews(data.reviews))
      .catch(() => setReviews([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const averageRating =
    reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  useEffect(() => {
    // Always fetch the contact link once logged in — it's routed to
    // DHIIL's own WhatsApp number, not the professional's personal one,
    // so it no longer depends on the professional's own WhatsApp opt-in.
    if (!user) return;
    apiFetch<{ link: string | null }>(`/api/professionals/${id}/whatsapp-link`)
      .then((data) => setWaLink(data.link))
      .catch(() => setWaLink(null));
  }, [user, id]);

  if (error) return <div className="mx-auto max-w-3xl px-4 py-6"><ErrorState message={error} /></div>;
  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            profile.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-sm text-gray-500">{profile.title || t("professionals.professionalOnDhiil")}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {profile.location && <span>{profile.location}</span>}
            <span>{t(availabilityKeys[profile.availability])}</span>
            {averageRating != null && reviews && (
              <span className="text-amber-600">
                ★ {t("reviews.averageRating", { rating: averageRating.toFixed(1), count: reviews.length })}
              </span>
            )}
            {profile.hourlyRate != null && (
              <span className="font-semibold text-brand-700">
                {formatCurrency(profile.hourlyRate, locale)}
                {t("jobs.budgetHourlySuffix")}
              </span>
            )}
          </div>
        </div>
      </div>

      {user?.role === "CLIENT" && (
        <div className="mt-3">
          <FavoriteButton
            targetType="PROFESSIONAL"
            targetId={id}
            savedLabelKey="jobs.favoriteAdd"
            unsavedLabelKey="jobs.favoriteRemove"
            toastSavedKey="favorites.savedProfessionalToast"
            toastRemovedKey="favorites.removedProfessionalToast"
          />
        </div>
      )}

      <div className="mt-4">
        {user ? (
          <WhatsAppButton link={waLink} label={t("professionals.contactOnWhatsapp")} fullWidth />
        ) : (
          <a
            href={`/login?next=/professionals/${id}`}
            className="block w-full rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-medium text-white"
          >
            {t("professionals.loginToContact")}
          </a>
        )}
      </div>

      {profile.bio && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">{t("professionals.aboutHeading")}</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{profile.bio}</p>
        </section>
      )}

      {profile.skills.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">{t("professionals.skillsHeading")}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <span key={s} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {profile.portfolio.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">{t("professionals.portfolioHeading")}</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profile.portfolio.map((p) => (
              <a
                key={p.id}
                href={p.projectUrl || "#"}
                target={p.projectUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 p-3 hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-900">{p.title}</p>
                {p.description && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{p.description}</p>}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-900">{t("reviews.reviewsHeading")}</h2>
        <div className="mt-2 space-y-2">
          {reviews === null && <Skeleton className="h-16 w-full" />}
          {reviews && reviews.length === 0 && (
            <EmptyState title={t("reviews.noReviewsTitle")} description={t("reviews.noReviewsDesc")} />
          )}
          {reviews?.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{r.reviewerName}</p>
                <span className="text-sm text-amber-500">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
              <p className="mt-1 text-xs text-gray-400">{formatDate(r.createdAt, locale)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
