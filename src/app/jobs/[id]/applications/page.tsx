"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { StatusBadge, EmptyState, ErrorState, Skeleton, ConfirmDialog, toast } from "@/components/ui/Misc";
import { Button, LinkButton } from "@/components/ui/Button";
import type { ApplicationDTO, ApplicationStatus, JobDTO, ProjectDTO } from "@/types";
import { CLIENT_APPLICATION_TRANSITIONS } from "@/types";

const statusUpdatedKey: Record<ApplicationStatus, string> = {
  PENDING: "applications.statusPending",
  SHORTLISTED: "applications.statusShortlisted",
  ACCEPTED: "applications.statusAccepted",
  REJECTED: "applications.statusRejected",
  WITHDRAWN: "applications.statusWithdrawn",
};

const actionLabelKey: Record<ApplicationStatus, string> = {
  PENDING: "applications.statusPending",
  SHORTLISTED: "applications.actionShortlist",
  ACCEPTED: "applications.actionAccept",
  REJECTED: "applications.actionReject",
  WITHDRAWN: "applications.actionWithdraw",
};

export default function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [job, setJob] = useState<JobDTO | null>(null);
  const [applications, setApplications] = useState<ApplicationDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingAccept, setPendingAccept] = useState<ApplicationDTO | null>(null);
  const [startedProject, setStartedProject] = useState<{ project: ProjectDTO; professionalName: string } | null>(null);

  async function load() {
    try {
      const [jobData, appsData] = await Promise.all([
        apiFetch<{ job: JobDTO }>(`/api/jobs/${id}`),
        apiFetch<{ applications: ApplicationDTO[] }>(`/api/jobs/${id}/applications`),
      ]);
      setJob(jobData.job);
      setApplications(appsData.applications);
    } catch (err) {
      setError(translateApiError(err, t));
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?next=/jobs/${id}/applications`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, id]);

  async function updateStatus(application: ApplicationDTO, status: ApplicationStatus) {
    setBusyId(application.id);
    try {
      const data = await apiFetch<{ application: ApplicationDTO; project?: ProjectDTO }>(
        `/api/applications/${application.id}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) }
      );
      if (status === "ACCEPTED" && data.project) {
        // Trust only the server's response — never simulate the job
        // close/competitor-reject/project-create side effects locally.
        setStartedProject({ project: data.project, professionalName: application.professionalName });
      } else {
        toast(t("applications.updated", { status: t(statusUpdatedKey[status]) }));
      }
      load();
    } catch (err) {
      toast(translateApiError(err, t), "error");
    } finally {
      setBusyId(null);
      setPendingAccept(null);
    }
  }

  function requestStatus(application: ApplicationDTO, status: ApplicationStatus) {
    if (status === "ACCEPTED") {
      setPendingAccept(application);
    } else {
      updateStatus(application, status);
    }
  }

  if (error) return <div className="mx-auto max-w-3xl px-4 py-6"><ErrorState message={error} onRetry={load} /></div>;

  if (startedProject) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("applications.projectStartedTitle")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("applications.projectStartedDesc", { job: startedProject.project.jobTitle })}
        </p>
        <div className="mt-6 space-y-3">
          <LinkButton href={`/projects/${startedProject.project.id}`} fullWidth size="lg">
            {t("applications.viewProjectButton")}
          </LinkButton>
          <LinkButton href={`/jobs/${id}`} variant="outline" fullWidth>
            {t("jobs.backToJob")}
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href={`/jobs/${id}`} className="text-sm text-brand-700">
        {t("jobs.backToJob")}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        {job ? t("jobs.applicationsForJob", { title: job.title }) : t("applications.myApplicationsTitle")}
      </h1>

      <div className="mt-5 space-y-3">
        {applications === null &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        {applications && applications.length === 0 && (
          <EmptyState title={t("jobs.noApplicationsTitle")} description={t("jobs.noApplicationsDesc")} />
        )}
        {applications?.map((app) => {
          const actions = CLIENT_APPLICATION_TRANSITIONS[app.status] || [];
          return (
            <div key={app.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/professionals/${app.professionalId}`} className="font-semibold text-gray-900 hover:underline">
                    {app.professionalName}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {t("jobs.submittedOn", { date: formatDate(app.submittedAt, locale) })}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">{app.coverLetter}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{t("jobs.proposedLabel", { amount: formatNumber(app.proposedPrice, locale) })}</span>
                <span>{t("jobs.deliveryLabel", { time: app.deliveryTime })}</span>
              </div>
              {actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {actions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === "REJECTED" ? "danger" : status === "ACCEPTED" ? "primary" : "outline"}
                      loading={busyId === app.id}
                      onClick={() => requestStatus(app, status)}
                    >
                      {t(actionLabelKey[status])}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={pendingAccept !== null}
        title={t("applications.confirmAcceptTitle")}
        description={t("applications.confirmAcceptDesc")}
        confirmLabel={busyId === pendingAccept?.id ? t("applications.accepting") : t("applications.acceptConfirmButton")}
        loading={busyId === pendingAccept?.id}
        onConfirm={() => pendingAccept && updateStatus(pendingAccept, "ACCEPTED")}
        onCancel={() => setPendingAccept(null)}
      />
    </div>
  );
}
