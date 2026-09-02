"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { JobCard } from "@/components/marketplace/JobCard";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/Misc";
import { Input, Select } from "@/components/ui/Field";
import type { JobDTO } from "@/types";

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsList />
    </Suspense>
  );
}

function JobsList() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [jobs, setJobs] = useState<JobDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      params.set("sort", sort);
      const data = await apiFetch<{ jobs: JobDTO[] }>(`/api/jobs?${params.toString()}`);
      setJobs(data.jobs);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load jobs.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">Browse open jobs from clients on DHIIL.</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setJobs(null);
          load();
        }}
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_140px_auto]"
      >
        <Input placeholder="Search jobs…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="budget_high">Budget: High to low</option>
          <option value="budget_low">Budget: Low to high</option>
        </Select>
        <button
          type="submit"
          className="tap-target rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {jobs === null && !error && Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        {error && (
          <div className="sm:col-span-2">
            <ErrorState message={error} onRetry={load} />
          </div>
        )}
        {jobs && jobs.length === 0 && (
          <div className="sm:col-span-2">
            <EmptyState title="No jobs found" description="Try adjusting your search or check back later." />
          </div>
        )}
        {jobs?.map((job) => <JobCard key={job.id} job={job} />)}
      </div>
    </div>
  );
}
