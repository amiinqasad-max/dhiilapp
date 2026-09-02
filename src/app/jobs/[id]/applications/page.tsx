"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { StatusBadge, EmptyState, ErrorState, Skeleton, toast } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import type { ApplicationDTO, ApplicationStatus, JobDTO } from "@/types";
import { CLIENT_APPLICATION_TRANSITIONS } from "@/types";

export default function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<JobDTO | null>(null);
  const [applications, setApplications] = useState<ApplicationDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const [jobData, appsData] = await Promise.all([
        apiFetch<{ job: JobDTO }>(`/api/jobs/${id}`),
        apiFetch<{ applications: ApplicationDTO[] }>(`/api/jobs/${id}/applications`),
      ]);
      setJob(jobData.job);
      setApplications(appsData.applications);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load applications.");
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

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setBusyId(applicationId);
    try {
      await apiFetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast(`Application ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Failed to update application.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <div className="mx-auto max-w-3xl px-4 py-6"><ErrorState message={error} onRetry={load} /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href={`/jobs/${id}`} className="text-sm text-brand-700">
        ← Back to job
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        Applications {job ? `for "${job.title}"` : ""}
      </h1>

      <div className="mt-5 space-y-3">
        {applications === null &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        {applications && applications.length === 0 && (
          <EmptyState title="No applications yet" description="Share this job on WhatsApp to reach more professionals." />
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
                    Submitted {new Date(app.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">{app.coverLetter}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>Proposed: ${app.proposedPrice.toLocaleString()}</span>
                <span>Delivery: {app.deliveryTime}</span>
              </div>
              {actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {actions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === "REJECTED" ? "danger" : status === "ACCEPTED" ? "primary" : "outline"}
                      loading={busyId === app.id}
                      onClick={() => updateStatus(app.id, status)}
                    >
                      {status === "SHORTLISTED" ? "Shortlist" : status.charAt(0) + status.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
