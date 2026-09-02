"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { formatCurrency, formatDate } from "@/lib/i18n/format";
import { StatusBadge, Skeleton, ErrorState, ConfirmDialog, toast } from "@/components/ui/Misc";
import { Button, LinkButton } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/marketplace/WhatsAppButton";
import { FavoriteButton } from "@/components/marketplace/FavoriteButton";
import { JOB_STATUS_TRANSITIONS, type JobDTO, type JobStatus } from "@/types";

type PendingAction = JobStatus | null;

// Only the hard-to-reverse transitions (CLOSED, CANCELLED) get a
// confirmation dialog — pausing/reopening is trivially reversible.
const confirmableTransitions: Partial<Record<JobStatus, { titleKey: string; descKey: string; variant: "primary" | "danger" }>> = {
  CLOSED: { titleKey: "jobs.confirmCloseJobTitle", descKey: "jobs.confirmCloseJobDesc", variant: "danger" },
  CANCELLED: { titleKey: "jobs.confirmCancelJobTitle", descKey: "jobs.confirmCancelJobDesc", variant: "danger" },
};

const statusActionLabelKey: Record<JobStatus, string> = {
  DRAFT: "jobs.reopenJobButton",
  OPEN: "jobs.reopenJobButton",
  PAUSED: "jobs.pauseJobButton",
  CLOSED: "jobs.closeJobButton",
  CANCELLED: "jobs.cancelJobButton",
  COMPLETED: "jobs.statusCompleted",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const [job, setJob] = useState<JobDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waShareLink, setWaShareLink] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  async function load() {
    try {
      const data = await apiFetch<{ job: JobDTO }>(`/api/jobs/${id}`);
      setJob(data.job);
    } catch (err) {
      setError(translateApiError(err, t));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isOwner = user && job && user.id === job.clientId;

  useEffect(() => {
    if (!isOwner) return;
    apiFetch<{ link: string }>(`/api/jobs/${id}/whatsapp-share-link`)
      .then((d) => setWaShareLink(d.link))
      .catch(() => setWaShareLink(null));
  }, [isOwner, id]);

  useEffect(() => {
    if (!user || user.role !== "PROFESSIONAL") return;
    apiFetch<{ applications: { jobId: string }[] }>("/api/applications")
      .then((d) => setHasApplied(d.applications.some((a) => a.jobId === id)))
      .catch(() => {});
  }, [user, id]);

  async function applyStatusChange(status: JobStatus) {
    if (!job) return;
    setUpdatingStatus(true);
    try {
      const data = await apiFetch<{ job: JobDTO }>(`/api/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setJob(data.job);
      toast(t("jobs.jobStatusUpdated", { status: t(statusKeyFor(status)) }));
    } catch (err) {
      toast(translateApiError(err, t), "error");
    } finally {
      setUpdatingStatus(false);
      setPendingAction(null);
    }
  }

  function requestStatusChange(status: JobStatus) {
    if (confirmableTransitions[status]) {
      setPendingAction(status);
    } else {
      applyStatusChange(status);
    }
  }

  function statusKeyFor(status: JobStatus) {
    const map: Record<JobStatus, string> = {
      DRAFT: "jobs.statusDraft",
      OPEN: "jobs.statusOpen",
      PAUSED: "jobs.statusPaused",
      CLOSED: "jobs.statusClosed",
      CANCELLED: "jobs.statusCancelled",
      COMPLETED: "jobs.statusCompleted",
    };
    return map[status];
  }

  const allowedTransitions = job ? JOB_STATUS_TRANSITIONS[job.status] || [] : [];
  const confirmConfig = pendingAction ? confirmableTransitions[pendingAction] : undefined;

  if (error) return <div className="mx-auto max-w-3xl px-4 py-6"><ErrorState message={error} /></div>;
  if (!job) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
        <StatusBadge status={job.status} />
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {t("jobs.postedBy", { name: job.clientName, date: formatDate(job.createdAt, locale) })}
      </p>

      {user?.role === "PROFESSIONAL" && (
        <div className="mt-3">
          <FavoriteButton
            targetType="JOB"
            targetId={job.id}
            savedLabelKey="jobs.favoriteAdd"
            unsavedLabelKey="jobs.favoriteRemove"
            toastSavedKey="favorites.savedJobToast"
            toastRemovedKey="favorites.removedJobToast"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">{t("common.budget")}</p>
          <p className="font-semibold text-brand-700">
            {formatCurrency(job.budget, locale)} {job.budgetType === "HOURLY" ? t("jobs.budgetHourlySuffix") : ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("common.category")}</p>
          <p className="font-medium text-gray-900">{job.category}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("jobs.jobTypeLabel")}</p>
          <p className="font-medium text-gray-900">{job.jobType === "ONGOING" ? t("jobs.jobTypeOngoing") : t("jobs.jobTypeOneTime")}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("jobs.remoteLabel")}</p>
          <p className="font-medium text-gray-900">{job.remote ? t("jobs.remoteYes") : t("jobs.remoteNo")}</p>
        </div>
        {job.location && (
          <div>
            <p className="text-xs text-gray-500">{t("common.location")}</p>
            <p className="font-medium text-gray-900">{job.location}</p>
          </div>
        )}
        {job.deadline && (
          <div>
            <p className="text-xs text-gray-500">{t("common.deadline")}</p>
            <p className="font-medium text-gray-900">{formatDate(job.deadline, locale)}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500">{t("jobs.applicantsLabel")}</p>
          <p className="font-medium text-gray-900">{job.applicationCount}</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-900">{t("jobs.descriptionHeading")}</h2>
        <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{job.description}</p>
      </section>

      {job.skills.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">{t("jobs.skillsHeading")}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <span key={s} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-[var(--bottom-nav-height)] z-30 border-t border-gray-200 bg-white p-3 safe-bottom md:static md:mt-8 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-3xl">
          {isOwner ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <WhatsAppButton link={waShareLink} label={t("whatsapp.shareOnWhatsapp")} fullWidth />
                <LinkButton href={`/jobs/${job.id}/applications`} variant="outline" fullWidth>
                  {t("jobs.viewApplicationsButton", { count: job.applicationCount })}
                </LinkButton>
              </div>
              {allowedTransitions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allowedTransitions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === "CANCELLED" || status === "CLOSED" ? "danger" : "ghost"}
                      loading={updatingStatus && pendingAction === status}
                      disabled={updatingStatus}
                      onClick={() => requestStatusChange(status)}
                    >
                      {t(statusActionLabelKey[status])}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : user?.role === "PROFESSIONAL" ? (
            hasApplied ? (
              <Button fullWidth size="lg" disabled>
                {t("jobs.applied")}
              </Button>
            ) : job.status === "OPEN" ? (
              <LinkButton href={`/jobs/${job.id}/apply`} fullWidth size="lg">
                {t("jobs.applyNow")}
              </LinkButton>
            ) : (
              <Button fullWidth size="lg" disabled>
                {t("jobs.jobClosed")}
              </Button>
            )
          ) : !user ? (
            <LinkButton href={`/login?next=/jobs/${job.id}`} fullWidth size="lg">
              {t("jobs.loginToApply")}
            </LinkButton>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={pendingAction !== null && !!confirmConfig}
        title={confirmConfig ? t(confirmConfig.titleKey) : ""}
        description={confirmConfig ? t(confirmConfig.descKey) : undefined}
        confirmLabel={pendingAction ? t(statusActionLabelKey[pendingAction]) : ""}
        confirmVariant={confirmConfig?.variant}
        loading={updatingStatus}
        onConfirm={() => pendingAction && applyStatusChange(pendingAction)}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
