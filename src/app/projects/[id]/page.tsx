"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { formatDate } from "@/lib/i18n/format";
import { apiFetch, translateApiError, ApiClientError } from "@/lib/api-client";
import { StatusBadge, EmptyState, ErrorState, ConfirmDialog, Skeleton, toast } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/marketplace/WhatsAppButton";
import type { ProjectDTO, ReviewDTO } from "@/types";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [reviews, setReviews] = useState<ReviewDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<"COMPLETED" | "CANCELLED" | null>(null);
  const [updating, setUpdating] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  async function load() {
    try {
      const [projectData, reviewsData] = await Promise.all([
        apiFetch<{ project: ProjectDTO }>(`/api/projects/${id}`),
        apiFetch<{ reviews: ReviewDTO[] }>(`/api/projects/${id}/reviews`),
      ]);
      setProject(projectData.project);
      setReviews(reviewsData.reviews);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(translateApiError(err, t));
      }
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?next=/projects/${id}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, id]);

  useEffect(() => {
    if (!project || !user) return;
    const path = user.role === "CLIENT" ? `/api/professionals/${project.professionalId}/whatsapp-link` : `/api/jobs/${project.jobId}/whatsapp-contact-link`;
    apiFetch<{ link: string | null }>(path)
      .then((d) => setWaLink(d.link))
      .catch(() => setWaLink(null));
  }, [project, user]);

  async function applyStatusChange(status: "COMPLETED" | "CANCELLED") {
    setUpdating(true);
    try {
      const data = await apiFetch<{ project: ProjectDTO }>(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setProject(data.project);
      toast(t("applications.updated", { status: t(status === "COMPLETED" ? "projects.statusCompleted" : "projects.statusCancelled") }));
    } catch (err) {
      toast(translateApiError(err, t), "error");
    } finally {
      setUpdating(false);
      setPendingStatus(null);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError(null);
    setSubmittingReview(true);
    try {
      const data = await apiFetch<{ review: ReviewDTO }>(`/api/projects/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      setReviews((prev) => [data.review, ...(prev || [])]);
      toast(t("reviews.submittedTitle"));
    } catch (err) {
      setReviewError(translateApiError(err, t));
    } finally {
      setSubmittingReview(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <EmptyState title={t("projects.notFoundTitle")} description={t("projects.notFoundDesc")} />
      </div>
    );
  }
  if (error) return <div className="mx-auto max-w-3xl px-4 py-6"><ErrorState message={error} onRetry={load} /></div>;
  if (!project) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const myReview = reviews?.find((r) => r.reviewerId === user?.id);
  const canReview = project.status === "COMPLETED" && !myReview;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <Link href="/projects" className="text-sm text-brand-700">
        {t("projects.backToProjects")}
      </Link>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{project.jobTitle}</h1>
        <StatusBadge status={project.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">{t("projects.clientLabel")}</p>
          <p className="font-medium text-gray-900">{project.clientName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("projects.professionalLabel")}</p>
          <Link href={`/professionals/${project.professionalId}`} className="font-medium text-brand-700 hover:underline">
            {project.professionalName}
          </Link>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("projects.relatedJobLabel")}</p>
          <Link href={`/jobs/${project.jobId}`} className="font-medium text-brand-700 hover:underline">
            {t("projects.viewJobLink")}
          </Link>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("projects.startedLabel")}</p>
          <p className="font-medium text-gray-900">{formatDate(project.startedAt, locale)}</p>
        </div>
        {project.completedAt && (
          <div>
            <p className="text-xs text-gray-500">{t("projects.completedLabel")}</p>
            <p className="font-medium text-gray-900">{formatDate(project.completedAt, locale)}</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <WhatsAppButton link={waLink} fullWidth />
      </div>

      {project.status === "ACTIVE" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setPendingStatus("COMPLETED")}>
            {t("projects.markCompletedButton")}
          </Button>
          <Button variant="danger" onClick={() => setPendingStatus("CANCELLED")}>
            {t("projects.cancelProjectButton")}
          </Button>
        </div>
      )}

      {canReview && (
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">{t("reviews.leaveReviewTitle")}</h2>
          <p className="mt-1 text-xs text-gray-500">{t("reviews.leaveReviewDesc")}</p>
          <form onSubmit={submitReview} className="mt-3 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">{t("reviews.ratingLabel")}</label>
              <div className="flex gap-1" role="radiogroup" aria-label={t("reviews.ratingLabel")}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} / 5`}
                    onClick={() => setRating(n)}
                    className={`tap-target flex h-10 w-10 items-center justify-center rounded-lg text-lg ${
                      n <= rating ? "text-amber-500" : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("reviews.commentPlaceholder")}
              className="w-full min-h-[90px] rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              aria-label={t("reviews.commentLabel")}
            />
            {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
            <Button type="submit" loading={submittingReview}>
              {t("reviews.submitButton")}
            </Button>
          </form>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900">{t("reviews.reviewsHeading")}</h2>
        <div className="mt-3 space-y-2">
          {reviews && reviews.length === 0 && (
            <EmptyState title={t("reviews.noReviewsTitle")} description={t("reviews.noReviewsDesc")} />
          )}
          {reviews?.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{r.reviewerName}</p>
                <span className="text-sm text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
              <p className="mt-1 text-xs text-gray-400">{formatDate(r.createdAt, locale)}</p>
            </div>
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={pendingStatus !== null}
        title={pendingStatus === "COMPLETED" ? t("projects.confirmCompleteTitle") : t("projects.confirmCancelTitle")}
        description={pendingStatus === "COMPLETED" ? t("projects.confirmCompleteDesc") : t("projects.confirmCancelDesc")}
        confirmLabel={pendingStatus === "COMPLETED" ? t("projects.markCompletedButton") : t("projects.cancelProjectButton")}
        confirmVariant={pendingStatus === "CANCELLED" ? "danger" : "primary"}
        loading={updating}
        onConfirm={() => pendingStatus && applyStatusChange(pendingStatus)}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}
