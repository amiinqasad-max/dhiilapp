"use client";

import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-card ${className}`}>{children}</div>
  );
}

const badgeColors: Record<string, string> = {
  OPEN: "bg-brand-50 text-brand-700",
  CLOSED: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-blue-50 text-blue-700",
  PENDING: "bg-amber-50 text-amber-700",
  SHORTLISTED: "bg-indigo-50 text-indigo-700",
  ACCEPTED: "bg-brand-50 text-brand-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-600",
  PROJECT: "bg-purple-50 text-purple-700",
  REVIEWED: "bg-teal-50 text-teal-700",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = badgeColors[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-12 text-center">
      <p className="text-base font-semibold text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
      <Skeleton className="mb-3 h-4 w-2/3" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="mb-2 h-3 w-5/6" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

let toastRoot: ((msg: string, kind?: "success" | "error") => void) | null = null;

export function registerToastHandler(fn: typeof toastRoot) {
  toastRoot = fn;
}

export function toast(message: string, kind: "success" | "error" = "success") {
  if (toastRoot) toastRoot(message, kind);
  else if (typeof window !== "undefined") {
    // Fallback so a toast never silently disappears if the host isn't mounted yet.
    // eslint-disable-next-line no-alert
    console.log(`[toast:${kind}]`, message);
  }
}
