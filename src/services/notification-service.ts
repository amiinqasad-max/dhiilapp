import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { NotificationType } from "@/types";

/** Anything with a `.notification.create(...)` shape — the top-level
 * PrismaClient, or a `tx` handed to a `prisma.$transaction(async (tx) =>
 * ...)` callback. Passing `tx` through lets a critical multi-step
 * operation (e.g. accepting an application) create its notifications as
 * part of the same atomic transaction — see src/services/project-service.ts. */
type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Centralized notification creation. All marketplace events that need to
 * notify a user go through here rather than being scattered inline.
 *
 * `title`/`message` are stored as an English audit-trail copy only — the
 * UI never renders them directly. Instead it renders localized copy from
 * `type` + `meta` (see src/lib/i18n/locales/*\/notifications.json and
 * src/app/activity/page.tsx), so a notification created while the app was
 * in one language still displays correctly in the other.
 */
export async function createNotification(
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    meta?: Record<string, string>;
  },
  db: Db = prisma
) {
  return db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      meta: params.meta ? JSON.stringify(params.meta) : null,
    },
  });
}

export const NotificationEvents = {
  applicationReceived(clientId: string, jobTitle: string, jobId: string, professionalName: string, db: Db = prisma) {
    return createNotification(
      {
        userId: clientId,
        type: "APPLICATION_RECEIVED",
        title: "New application received",
        message: `${professionalName} applied to "${jobTitle}".`,
        link: `/jobs/${jobId}/applications`,
        meta: { jobTitle, professionalName },
      },
      db
    );
  },
  applicationShortlisted(professionalId: string, jobTitle: string, jobId: string, db: Db = prisma) {
    return createNotification(
      {
        userId: professionalId,
        type: "APPLICATION_SHORTLISTED",
        title: "You've been shortlisted",
        message: `Your application for "${jobTitle}" has been shortlisted.`,
        link: `/jobs/${jobId}`,
        meta: { jobTitle },
      },
      db
    );
  },
  applicationAccepted(professionalId: string, jobTitle: string, jobId: string, db: Db = prisma) {
    return createNotification(
      {
        userId: professionalId,
        type: "APPLICATION_ACCEPTED",
        title: "Application accepted",
        message: `Your application for "${jobTitle}" has been accepted.`,
        link: `/jobs/${jobId}`,
        meta: { jobTitle },
      },
      db
    );
  },
  applicationRejected(professionalId: string, jobTitle: string, jobId: string, db: Db = prisma) {
    return createNotification(
      {
        userId: professionalId,
        type: "APPLICATION_REJECTED",
        title: "Application update",
        message: `Your application for "${jobTitle}" was not selected this time.`,
        link: `/jobs/${jobId}`,
        meta: { jobTitle },
      },
      db
    );
  },
  applicationWithdrawn(clientId: string, jobTitle: string, jobId: string, professionalName: string, db: Db = prisma) {
    return createNotification(
      {
        userId: clientId,
        type: "APPLICATION_WITHDRAWN",
        title: "Application withdrawn",
        message: `${professionalName} withdrew their application for "${jobTitle}".`,
        link: `/jobs/${jobId}/applications`,
        meta: { jobTitle, professionalName },
      },
      db
    );
  },
  jobStatusChanged(professionalId: string, jobTitle: string, jobId: string, status: string, db: Db = prisma) {
    return createNotification(
      {
        userId: professionalId,
        type: "JOB_STATUS_CHANGED",
        title: "Job status updated",
        message: `"${jobTitle}" is now ${status.toLowerCase()}.`,
        link: `/jobs/${jobId}`,
        meta: { jobTitle, status },
      },
      db
    );
  },
  /** Fired for both the client and the professional when a project is created. */
  projectCreated(userId: string, jobTitle: string, projectId: string, db: Db = prisma) {
    return createNotification(
      {
        userId,
        type: "PROJECT_CREATED",
        title: "Project started",
        message: `A project for "${jobTitle}" has started.`,
        link: `/projects/${projectId}`,
        meta: { jobTitle },
      },
      db
    );
  },
  /** Fired for the other party when one side marks the project completed. */
  projectCompleted(userId: string, jobTitle: string, projectId: string, db: Db = prisma) {
    return createNotification(
      {
        userId,
        type: "PROJECT_COMPLETED",
        title: "Project completed",
        message: `The project for "${jobTitle}" has been marked completed.`,
        link: `/projects/${projectId}`,
        meta: { jobTitle },
      },
      db
    );
  },
  reviewReceived(revieweeId: string, reviewerName: string, projectId: string, db: Db = prisma) {
    return createNotification(
      {
        userId: revieweeId,
        type: "REVIEW_RECEIVED",
        title: "New review received",
        message: `${reviewerName} left you a review.`,
        link: `/projects/${projectId}`,
        meta: { professionalName: reviewerName },
      },
      db
    );
  },
};
