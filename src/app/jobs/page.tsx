"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { JobCard } from "@/components/marketplace/JobCard";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/Misc";
import { Input, Select } from "@/components/ui/Field";
import { useTranslation } from "@/context/I18nContext";
import type { JobDTO } from "@/types";

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsList />
    </Suspense>
  );
}

function JobsList() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("");
  const [remote, setRemote] = useState("");
  const [skill, setSkill] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sort, setSort] = useState("newest");
  const [jobs, setJobs] = useState<JobDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  async function load() {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (jobType) params.set("jobType", jobType);
      if (remote) params.set("remote", remote);
      if (skill) params.set("skill", skill);
      if (minBudget) params.set("minBudget", minBudget);
      if (maxBudget) params.set("maxBudget", maxBudget);
      params.set("sort", sort);
      // The public marketplace only ever asks for OPEN jobs — the server
      // already defaults to that, this is just explicit about intent.
      params.set("status", "OPEN");
      const data = await apiFetch<{ jobs: JobDTO[] }>(`/api/jobs?${params.toString()}`);
      setJobs(data.jobs);
    } catch (err) {
      setError(translateApiError(err, t));
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
          <h1 className="text-2xl font-bold text-gray-900">{t("jobs.findJobsTitle")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("jobs.findJobsSubtitle")}</p>
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
        <Input placeholder={t("jobs.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
        <Input placeholder={t("jobs.categoryPlaceholder")} value={category} onChange={(e) => setCategory(e.target.value)} />
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">{t("jobs.sortNewest")}</option>
          <option value="budget_high">{t("jobs.sortBudgetHigh")}</option>
          <option value="budget_low">{t("jobs.sortBudgetLow")}</option>
        </Select>
        <button
          type="submit"
          className="tap-target rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t("jobs.searchButton")}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setShowFilters((s) => !s)}
        className="tap-target mt-3 text-sm font-medium text-brand-700"
        aria-expanded={showFilters}
      >
        {t("jobs.filtersTitle")} <span aria-hidden="true">{showFilters ? "▲" : "▼"}</span>
      </button>

      {showFilters && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setJobs(null);
            load();
          }}
          className="mt-3 grid grid-cols-2 gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 sm:grid-cols-4"
        >
          <Select value={jobType} onChange={(e) => setJobType(e.target.value)} label={t("jobs.jobTypeLabel")}>
            <option value="">{t("jobs.filterAllTypes")}</option>
            <option value="ONE_TIME">{t("jobs.jobTypeOneTime")}</option>
            <option value="ONGOING">{t("jobs.jobTypeOngoing")}</option>
          </Select>
          <Select value={remote} onChange={(e) => setRemote(e.target.value)} label={t("jobs.remoteLabel")}>
            <option value="">{t("jobs.filterAllLocations")}</option>
            <option value="true">{t("jobs.remoteYes")}</option>
            <option value="false">{t("jobs.remoteNo")}</option>
          </Select>
          <Input
            label={t("jobs.filterMinBudget")}
            type="number"
            min={0}
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
          />
          <Input
            label={t("jobs.filterMaxBudget")}
            type="number"
            min={0}
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
          <div className="col-span-2 sm:col-span-4">
            <Input label={t("jobs.filterSkill")} value={skill} onChange={(e) => setSkill(e.target.value)} />
          </div>
          <button
            type="submit"
            className="tap-target col-span-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 sm:col-span-4"
          >
            {t("jobs.searchButton")}
          </button>
        </form>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {jobs === null && !error && Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        {error && (
          <div className="sm:col-span-2">
            <ErrorState message={error} onRetry={load} />
          </div>
        )}
        {jobs && jobs.length === 0 && (
          <div className="sm:col-span-2">
            <EmptyState title={t("jobs.emptyTitle")} description={t("jobs.emptyDesc")} />
          </div>
        )}
        {jobs?.map((job) => <JobCard key={job.id} job={job} />)}
      </div>
    </div>
  );
}
