"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge, Skeleton, ErrorState, toast } from "@/components/ui/Misc";
import { Button, LinkButton } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/marketplace/WhatsAppButton";
import type { JobDTO } from "@/types";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<JobDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waShareLink, setWaShareLink] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function load() {
    try {
      const data = await apiFetch<{ job: JobDTO }>(`/api/jobs/${id}`);
      setJob(data.job);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load job.");
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

  async function closeJob() {
    if (!job) return;
    setUpdatingStatus(true);
    try {
      await apiFetch(`/api/jobs/${job.id}`, { method: "PATCH", body: JSON.stringify({ status: "CLOSED" }) });
      toast("Job closed.");
      load();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Failed to update job.", "error");
    } finally {
      setUpdatingStatus(false);
    }
  }

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
        Posted by {job.clientName} · {new Date(job.createdAt).toLocaleDateString()}
      </p>

      <div className="mt-4 flex flex-wrap gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">Budget</p>
          <p className="font-semibold text-brand-700">
            ${job.budget.toLocaleString()} {job.budgetType === "HOURLY" ? "/ hr" : ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Category</p>
          <p className="font-medium text-gray-900">{job.category}</p>
        </div>
        {job.location && (
          <div>
            <p className="text-xs text-gray-500">Location</p>
            <p className="font-medium text-gray-900">{job.location}</p>
          </div>
        )}
        {job.deadline && (
          <div>
            <p className="text-xs text-gray-500">Deadline</p>
            <p className="font-medium text-gray-900">{new Date(job.deadline).toLocaleDateString()}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500">Applicants</p>
          <p className="font-medium text-gray-900">{job.applicationCount}</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-900">Description</h2>
        <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{job.description}</p>
      </section>

      {job.skills.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">Skills</h2>
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <WhatsAppButton link={waShareLink} label="Share on WhatsApp" fullWidth />
              <LinkButton href={`/jobs/${job.id}/applications`} variant="outline" fullWidth>
                View applications ({job.applicationCount})
              </LinkButton>
              {job.status === "OPEN" && (
                <Button variant="ghost" onClick={closeJob} loading={updatingStatus}>
                  Close job
                </Button>
              )}
            </div>
          ) : user?.role === "PROFESSIONAL" ? (
            hasApplied ? (
              <Button fullWidth size="lg" disabled>
                Applied
              </Button>
            ) : job.status === "OPEN" ? (
              <LinkButton href={`/jobs/${job.id}/apply`} fullWidth size="lg">
                Apply Now
              </LinkButton>
            ) : (
              <Button fullWidth size="lg" disabled>
                Job closed
              </Button>
            )
          ) : !user ? (
            <LinkButton href={`/login?next=/jobs/${job.id}`} fullWidth size="lg">
              Log in to apply
            </LinkButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
