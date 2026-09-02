// Shared domain types — the contract the future native (Android/iOS/React
// Native) clients would consume from the same DHIIL API responses. Keep
// these in sync with prisma/schema.prisma's string-encoded enums.

export type Role = "CLIENT" | "PROFESSIONAL" | "ADMIN";

export const ROLES: Role[] = ["CLIENT", "PROFESSIONAL", "ADMIN"];

export type JobStatus = "DRAFT" | "OPEN" | "PAUSED" | "CLOSED" | "CANCELLED" | "COMPLETED";
export const JOB_STATUSES: JobStatus[] = ["DRAFT", "OPEN", "PAUSED", "CLOSED", "CANCELLED", "COMPLETED"];

/** How the job is priced. */
export type JobBudgetType = "FIXED" | "HOURLY";
export const JOB_BUDGET_TYPES: JobBudgetType[] = ["FIXED", "HOURLY"];

/** Whether the work is a single one-off task or an ongoing engagement —
 * an axis independent of how it's priced (JobBudgetType). */
export type JobType = "ONE_TIME" | "ONGOING";
export const JOB_TYPES: JobType[] = ["ONE_TIME", "ONGOING"];

// Job status transitions a client may trigger directly via PATCH
// /api/jobs/:id. CLOSED (reached when an application is accepted) and
// COMPLETED (reached when the resulting project completes) are system-
// driven and intentionally not reachable from here — see
// src/services/project-service.ts.
export const JOB_STATUS_TRANSITIONS: Record<string, JobStatus[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["PAUSED", "CLOSED", "CANCELLED"],
  PAUSED: ["OPEN", "CLOSED", "CANCELLED"],
};

export type ApplicationStatus = "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "PENDING",
  "SHORTLISTED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

// Valid application status transitions, keyed by actor. ACCEPTED is
// terminal for the application itself — accepting one goes through the
// dedicated transactional accept flow (creates a Project), never a plain
// status PATCH; see src/services/project-service.ts.
export const CLIENT_APPLICATION_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  PENDING: ["SHORTLISTED", "REJECTED", "ACCEPTED"],
  SHORTLISTED: ["ACCEPTED", "REJECTED"],
};

export const PROFESSIONAL_APPLICATION_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  PENDING: ["WITHDRAWN"],
  SHORTLISTED: ["WITHDRAWN"],
};

export type ProjectStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export const PROJECT_STATUSES: ProjectStatus[] = ["ACTIVE", "COMPLETED", "CANCELLED"];

export const PROJECT_STATUS_TRANSITIONS: Record<string, ProjectStatus[]> = {
  ACTIVE: ["COMPLETED", "CANCELLED"],
};

export type NotificationType =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_SHORTLISTED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "APPLICATION_WITHDRAWN"
  | "JOB_STATUS_CHANGED"
  | "PROJECT_CREATED"
  | "PROJECT_COMPLETED"
  | "REVIEW_RECEIVED";

export type Availability = "AVAILABLE" | "BUSY" | "UNAVAILABLE";
export const AVAILABILITIES: Availability[] = ["AVAILABLE", "BUSY", "UNAVAILABLE"];

export type FavoriteTargetType = "JOB" | "PROFESSIONAL";
export const FAVORITE_TARGET_TYPES: FavoriteTargetType[] = ["JOB", "PROFESSIONAL"];

export type ReportTargetType = "USER" | "JOB" | "APPLICATION" | "PORTFOLIO";
export const REPORT_TARGET_TYPES: ReportTargetType[] = ["USER", "JOB", "APPLICATION", "PORTFOLIO"];

export type ReportStatus = "OPEN" | "REVIEWED" | "DISMISSED" | "ACTIONED";
export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface PublicUser {
  id: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface AuthenticatedUser extends PublicUser {
  email: string;
  country: string | null;
  phoneCountry: string | null;
  phoneNumber: string | null;
  isWhatsapp: boolean;
}

export interface JobDTO {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  budgetType: JobBudgetType;
  jobType: JobType;
  location: string | null;
  remote: boolean;
  skills: string[];
  deadline: string | null;
  status: JobStatus;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDTO {
  id: string;
  jobId: string;
  jobTitle: string;
  professionalId: string;
  professionalName: string;
  coverLetter: string;
  proposedPrice: number;
  deliveryTime: string;
  portfolioId: string | null;
  status: ApplicationStatus;
  submittedAt: string;
  whatsappContactedAt: string | null;
}

export interface ProjectDTO {
  id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  status: ProjectStatus;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDTO {
  id: string;
  projectId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface FavoriteJobSummary {
  title: string;
  status: JobStatus;
  budget: number;
  category: string;
}

export interface FavoriteProfessionalSummary {
  name: string;
  title: string | null;
}

export interface FavoriteDTO {
  id: string;
  targetType: FavoriteTargetType;
  targetId: string;
  createdAt: string;
  /** A small summary of the favorited job/professional, batch-loaded by
   * the API — null if the target no longer exists. */
  target: FavoriteJobSummary | FavoriteProfessionalSummary | null;
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  /** English audit-trail copy — UI should prefer rendering from `type` +
   * `meta` via i18n so the notification displays in the active language
   * regardless of which language it was created under. */
  title: string;
  message: string;
  meta: Record<string, string> | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ProfessionalProfileDTO {
  id: string;
  userId: string;
  name: string;
  title: string | null;
  bio: string | null;
  hourlyRate: number | null;
  experience: number | null;
  location: string | null;
  languages: string[];
  availability: Availability;
  avatarUrl: string | null;
  profileComplete: boolean;
  skills: string[];
  portfolio: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    projectUrl: string | null;
  }[];
  whatsappAvailable: boolean;
}

/** Batch-loaded applicant summary attached to each row of
 * GET /api/jobs/:id/applications — lets the client make an informed
 * shortlist/accept decision without an extra request per applicant. */
export interface ApplicantSummary {
  title: string | null;
  skills: string[];
  portfolioCount: number;
  averageRating: number | null;
  reviewCount: number;
}

export interface ApplicationWithApplicantDTO extends ApplicationDTO {
  applicant: ApplicantSummary;
}

export interface ApiError {
  error: string;
  code?: string;
}
