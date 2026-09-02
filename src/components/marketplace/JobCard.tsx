import Link from "next/link";
import { StatusBadge } from "@/components/ui/Misc";
import type { JobDTO } from "@/types";

export function JobCard({ job }: { job: JobDTO }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-card transition-shadow hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">{job.title}</h3>
        <StatusBadge status={job.status} />
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{job.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="font-semibold text-brand-700">
          ${job.budget.toLocaleString()} {job.budgetType === "HOURLY" ? "/ hr" : ""}
        </span>
        <span>{job.category}</span>
        {job.location && <span>{job.location}</span>}
        <span>{job.applicationCount} applicant{job.applicationCount === 1 ? "" : "s"}</span>
      </div>
      {job.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
              {s}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
