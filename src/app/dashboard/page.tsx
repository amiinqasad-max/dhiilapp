"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
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
        <h1 className="text-2xl font-bold text-gray-900">Your dashboard</h1>
        <LinkButton href="/jobs/new" size="sm">
          + Post a job
        </LinkButton>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatTile label="Active jobs" value={active} />
        <StatTile label="Closed jobs" value={closed} />
        <StatTile label="Completed" value={completed} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <StatTile label="New applications" value={pending} />
        <StatTile label="Shortlisted" value={shortlisted} />
        <StatTile label="Accepted" value={accepted} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">My Jobs</h2>
      <div className="mt-3 space-y-2">
        {jobs === null && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {jobs && jobs.length === 0 && (
          <EmptyState title="No jobs yet" description="Post your first job to start receiving applications." action={<LinkButton href="/jobs/new">Post a job</LinkButton>} />
        )}
        {jobs?.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{job.title}</p>
              <p className="text-xs text-gray-500">{job.applicationCount} applicant{job.applicationCount === 1 ? "" : "s"}</p>
            </div>
            <StatusBadge status={job.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProfessionalDashboard() {
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
        <h1 className="text-2xl font-bold text-gray-900">Your dashboard</h1>
        <LinkButton href="/jobs" size="sm">
          Browse jobs
        </LinkButton>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Pending" value={pending} />
        <StatTile label="Shortlisted" value={shortlisted} />
        <StatTile label="Accepted" value={accepted} />
        <StatTile label="Completed" value={completed} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">My Applications</h2>
      <div className="mt-3 space-y-2">
        {applications === null && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {applications && applications.length === 0 && (
          <EmptyState title="No applications yet" description="Browse open jobs and apply." action={<LinkButton href="/jobs">Browse jobs</LinkButton>} />
        )}
        {applications?.map((app) => (
          <Link
            key={app.id}
            href={`/jobs/${app.jobId}`}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{app.jobTitle}</p>
              <p className="text-xs text-gray-500">Submitted {new Date(app.submittedAt).toLocaleDateString()}</p>
            </div>
            <StatusBadge status={app.status} />
          </Link>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">Recommended Jobs</h2>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {recommended?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-xl border border-gray-200 bg-white p-3.5 hover:bg-gray-50">
            <p className="truncate text-sm font-medium text-gray-900">{job.title}</p>
            <p className="text-xs text-gray-500">${job.budget.toLocaleString()} · {job.category}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
