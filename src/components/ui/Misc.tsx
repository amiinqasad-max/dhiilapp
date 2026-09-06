"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "@/context/I18nContext";
import { Button } from "@/components/ui/Button";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-gray-100 bg-white/90 p-4 shadow-card ${className}`}>{children}</div>
  );
}

const badgeColors: Record<string, string> = {
  OPEN: "bg-brand-50 text-brand-700",
  CLOSED: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-blue-50 text-blue-700",
  PAUSED: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-700",
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-brand-50 text-brand-700",
  PENDING: "bg-amber-50 text-amber-700",
  SHORTLISTED: "bg-indigo-50 text-indigo-700",
  ACCEPTED: "bg-brand-50 text-brand-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};

// Job statuses live in jobs.json, application statuses in
// applications.json, project statuses in projects.json — COMPLETED is
// shared across jobs/applications/projects.
const statusKeys: Record<string, string> = {
  OPEN: "jobs.statusOpen",
  CLOSED: "jobs.statusClosed",
  PAUSED: "jobs.statusPaused",
  CANCELLED: "jobs.statusCancelled",
  DRAFT: "jobs.statusDraft",
  COMPLETED: "applications.statusCompleted",
  ACTIVE: "projects.statusActive",
  PENDING: "applications.statusPending",
  SHORTLISTED: "applications.statusShortlisted",
  ACCEPTED: "applications.statusAccepted",
  REJECTED: "applications.statusRejected",
  WITHDRAWN: "applications.statusWithdrawn",
  DISMISSED: "admin.reportStatusDismissed",
  ACTIONED: "admin.reportStatusActioned",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const cls = badgeColors[status] || "bg-gray-100 text-gray-700";
  const key = statusKeys[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {key ? t(key) : status}
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
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          {t("common.retry")}
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

/**
 * Blocking confirmation dialog for hard-to-reverse actions (accepting an
 * application, closing/cancelling a job, completing/cancelling a project).
 * Native `<dialog>` gives us focus trapping, Escape-to-close, and correct
 * screen-reader semantics for free.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = "primary",
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Remember what had focus so it can be restored on close (the button
    // that opened the dialog, in every real caller), and move focus into
    // the dialog itself — never leave keyboard focus behind on the page.
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Return focus to the trigger — a keyboard/screen-reader user must
      // land back where they were, not at the top of the page.
      previouslyFocused.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? "confirm-dialog-description" : undefined}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
          {title}
        </h2>
        {description && (
          <p id="confirm-dialog-description" className="mt-1.5 text-sm text-gray-600">
            {description}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <Button ref={cancelRef} variant="outline" fullWidth onClick={onCancel} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button variant={confirmVariant} fullWidth onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
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
