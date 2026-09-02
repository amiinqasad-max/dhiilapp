import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/types";

/**
 * Centralized notification creation. All marketplace events that need to
 * notify a user go through here rather than being scattered inline —
 * keeps notification copy/shape consistent and reusable by future native
 * clients hitting the same underlying events.
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });
}

export const NotificationEvents = {
  newApplication(clientId: string, jobTitle: string, jobId: string, professionalName: string) {
    return createNotification({
      userId: clientId,
      type: "NEW_APPLICATION",
      title: "New application received",
      message: `${professionalName} applied to "${jobTitle}".`,
      link: `/jobs/${jobId}/applications`,
    });
  },
  applicationShortlisted(professionalId: string, jobTitle: string, jobId: string) {
    return createNotification({
      userId: professionalId,
      type: "APPLICATION_SHORTLISTED",
      title: "You've been shortlisted",
      message: `Your application for "${jobTitle}" has been shortlisted.`,
      link: `/jobs/${jobId}`,
    });
  },
  applicationAccepted(professionalId: string, jobTitle: string, jobId: string) {
    return createNotification({
      userId: professionalId,
      type: "APPLICATION_ACCEPTED",
      title: "Application accepted",
      message: `Your application for "${jobTitle}" has been accepted.`,
      link: `/jobs/${jobId}`,
    });
  },
  applicationRejected(professionalId: string, jobTitle: string, jobId: string) {
    return createNotification({
      userId: professionalId,
      type: "APPLICATION_REJECTED",
      title: "Application update",
      message: `Your application for "${jobTitle}" was not selected this time.`,
      link: `/jobs/${jobId}`,
    });
  },
  applicationWithdrawn(clientId: string, jobTitle: string, jobId: string, professionalName: string) {
    return createNotification({
      userId: clientId,
      type: "APPLICATION_WITHDRAWN",
      title: "Application withdrawn",
      message: `${professionalName} withdrew their application for "${jobTitle}".`,
      link: `/jobs/${jobId}/applications`,
    });
  },
  jobStatusChanged(professionalId: string, jobTitle: string, jobId: string, status: string) {
    return createNotification({
      userId: professionalId,
      type: "JOB_STATUS_CHANGED",
      title: "Job status updated",
      message: `"${jobTitle}" is now ${status.toLowerCase()}.`,
      link: `/jobs/${jobId}`,
    });
  },
};
