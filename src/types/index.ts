// Shared domain types — the contract the future native (Android/iOS/React
// Native) clients would consume from the same DHIIL API responses. Keep
// these in sync with prisma/schema.prisma's string-encoded enums.

export type Role = "CLIENT" | "PROFESSIONAL" | "ADMIN";

export const ROLES: Role[] = ["CLIENT", "PROFESSIONAL", "ADMIN"];

export type JobStatus = "OPEN" | "CLOSED" | "COMPLETED";
export const JOB_STATUSES: JobStatus[] = ["OPEN", "CLOSED", "COMPLETED"];

export type JobType = "FIXED" | "HOURLY";
export const JOB_TYPES: JobType[] = ["FIXED", "HOURLY"];

export type ApplicationStatus =
  | "PENDING"
  | "SHORTLISTED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "PROJECT"
  | "COMPLETED"
  | "REVIEWED";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "PENDING",
  "SHORTLISTED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "PROJECT",
  "COMPLETED",
  "REVIEWED",
];

// Valid application status transitions, keyed by actor.
export const CLIENT_APPLICATION_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  PENDING: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["PROJECT"],
  PROJECT: ["COMPLETED"],
  COMPLETED: ["REVIEWED"],
};

export const PROFESSIONAL_APPLICATION_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  PENDING: ["WITHDRAWN"],
  SHORTLISTED: ["WITHDRAWN"],
};

export type NotificationType =
  | "NEW_APPLICATION"
  | "APPLICATION_SHORTLISTED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "APPLICATION_WITHDRAWN"
  | "JOB_STATUS_CHANGED"
  | "REVIEW_RECEIVED";

export type Availability = "AVAILABLE" | "BUSY" | "UNAVAILABLE";
export const AVAILABILITIES: Availability[] = ["AVAILABLE", "BUSY", "UNAVAILABLE"];

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
  budgetType: JobType;
  location: string | null;
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

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
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

export interface ApiError {
  error: string;
}
