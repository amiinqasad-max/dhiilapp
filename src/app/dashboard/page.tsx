"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { formatCurrency, formatDate } from "@/lib/i18n/format";
import { apiFetch } from "@/lib/api-client";
import { Card, StatusBadge, Skeleton, EmptyState } from "@/components/ui/Misc";
import { LinkButton } from "@/components/ui/Button";
import type { ApplicationDTO, JobDTO } from "@/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/dashboard");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return user.role === "CLIENT" ? <ClientDashboard /> : <ProfessionalDashboard />;
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </Card>
  );
}

function ClientDashboard() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<JobDTO[] | null>(null);
  const [applications, setApplications] = useState<ApplicationDTO[] | null>(null);

  useEffect(() => {
    apiFetch<{ jobs: JobDTO[] }>("/api/jobs?mine=true").then((d) => setJobs(d.jobs));
    apiFetch<{ applications: ApplicationDTO[] }>("/api/applications").then((d) => setApplications(d.applications));
  }, []);

  const active = jobs?.filter((j) => j.status === "OPEN").length ?? 0;
  const closed = jobs?.filter((j) => j.status === "CLOSED").length ?? 0;
  const completed = jobs?.filter((j) => j.status === "COMPLETED").length ?? 0;
  const pending = applications?.filter((a) => a.status === "PENDING").length ?? 0;
  const shortlisted = applications?.filter((a) => a.status === "SHORTLISTED").length ?? 0;
  const accepted = applications?.filter((a) => a.status === "ACCEPTED").length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>
        <LinkButton href="/jobs/new" size="sm">
          {t("dashboard.postJobButton")}
        </LinkButton>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatTile label={t("dashboard.activeJobs")} value={active} />
        <StatTile label={t("dashboard.closedJobs")} value={closed} />
        <StatTile label={t("dashboard.completedJobs")} value={completed} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <StatTile label={t("dashboard.newApplicationsTile")} value={pending} />
        <StatTile label={t("dashboard.shortlistedTile")} value={shortlisted} />
        <StatTile label={t("dashboard.acceptedTile")} value={accepted} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">{t("jobs.myJobsTitle")}</h2>
      <div className="mt-3 space-y-2">
        {jobs === null && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {jobs && jobs.length === 0 && (
          <EmptyState
            title={t("jobs.noJobsTitle")}
            description={t("jobs.noJobsDesc")}
            action={<LinkButton href="/jobs/new">{t("dashboard.postJobButton")}</LinkButton>}
          />
        )}
        {jobs?.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{job.title}</p>
              <p className="text-xs text-gray-500">{t("jobs.applicantsCount", { count: job.applicationCount })}</p>
            </div>
            <StatusBadge status={job.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProfessionalDashboard() {
  const { t, locale } = useTranslation();
  const [applications, setApplications] = useState<ApplicationDTO[] | null>(null);
  const [recommended, setRecommended] = useState<JobDTO[] | null>(null);

  useEffect(() => {
    apiFetch<{ applications: ApplicationDTO[] }>("/api/applications").then((d) => setApplications(d.applications));
    apiFetch<{ jobs: JobDTO[] }>("/api/jobs?status=OPEN&sort=newest").then((d) => setRecommended(d.jobs.slice(0, 4)));
  }, []);

  const pending = applications?.filter((a) => a.status === "PENDING").length ?? 0;
  const shortlisted = applications?.filter((a) => a.status === "SHORTLISTED").length ?? 0;
  const accepted = applications?.filter((a) => a.status === "ACCEPTED").length ?? 0;
  const completed = applications?.filter((a) => a.status === "COMPLETED").length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>
        <LinkButton href="/jobs" size="sm">
          {t("dashboard.browseJobsButton")}
        </LinkButton>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("dashboard.pendingTile")} value={pending} />
        <StatTile label={t("dashboard.shortlistedTile")} value={shortlisted} />
        <StatTile label={t("dashboard.acceptedTile")} value={accepted} />
        <StatTile label={t("dashboard.completedTile")} value={completed} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">{t("applications.myApplicationsTitle")}</h2>
      <div className="mt-3 space-y-2">
        {applications === null && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {applications && applications.length === 0 && (
          <EmptyState
            title={t("jobs.noApplicationsYetShort")}
            description={t("jobs.browseAndApplyDesc")}
            action={<LinkButton href="/jobs">{t("dashboard.browseJobsButton")}</LinkButton>}
          />
        )}
        {applications?.map((app) => (
          <Link
            key={app.id}
            href={`/jobs/${app.jobId}`}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{app.jobTitle}</p>
              <p className="text-xs text-gray-500">{t("jobs.submittedOn", { date: formatDate(app.submittedAt, locale) })}</p>
            </div>
            <StatusBadge status={app.status} />
          </Link>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">{t("jobs.recommendedJobsTitle")}</h2>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {recommended?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-xl border border-gray-200 bg-white p-3.5 hover:bg-gray-50">
            <p className="truncate text-sm font-medium text-gray-900">{job.title}</p>
            <p className="text-xs text-gray-500">
              {formatCurrency(job.budget, locale)} · {job.category}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
