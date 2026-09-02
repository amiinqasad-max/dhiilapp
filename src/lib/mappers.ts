import type {
  ApplicationDTO,
  ApplicationStatus,
  JobDTO,
  JobStatus,
  JobBudgetType,
  JobType,
  NotificationDTO,
  NotificationType,
  ProfessionalProfileDTO,
  ProjectDTO,
  ProjectStatus,
  ReviewDTO,
  FavoriteDTO,
  FavoriteTargetType,
  FavoriteJobSummary,
  FavoriteProfessionalSummary,
  Availability,
} from "@/types";

export function toJobDTO(
  job: {
    id: string;
    clientId: string;
    title: string;
    description: string;
    category: string;
    budget: number;
    budgetType: string;
    jobType: string;
    location: string | null;
    remote: boolean;
    skills: string | null;
    deadline: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    client?: { name: string } | null;
    _count?: { applications: number };
  },
  applicationCount?: number
): JobDTO {
  return {
    id: job.id,
    clientId: job.clientId,
    clientName: job.client?.name ?? "",
    title: job.title,
    description: job.description,
    category: job.category,
    budget: job.budget,
    budgetType: job.budgetType as JobBudgetType,
    jobType: job.jobType as JobType,
    location: job.location,
    remote: job.remote,
    skills: job.skills ? job.skills.split(",").filter(Boolean) : [],
    deadline: job.deadline ? job.deadline.toISOString() : null,
    status: job.status as JobStatus,
    applicationCount: applicationCount ?? job._count?.applications ?? 0,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export function toApplicationDTO(app: {
  id: string;
  jobId: string;
  professionalId: string;
  coverLetter: string;
  proposedPrice: number;
  deliveryTime: string;
  portfolioId: string | null;
  status: string;
  submittedAt: Date;
  whatsappContactedAt: Date | null;
  job?: { title: string } | null;
  professional?: { name: string } | null;
}): ApplicationDTO {
  return {
    id: app.id,
    jobId: app.jobId,
    jobTitle: app.job?.title ?? "",
    professionalId: app.professionalId,
    professionalName: app.professional?.name ?? "",
    coverLetter: app.coverLetter,
    proposedPrice: app.proposedPrice,
    deliveryTime: app.deliveryTime,
    portfolioId: app.portfolioId,
    status: app.status as ApplicationStatus,
    submittedAt: app.submittedAt.toISOString(),
    whatsappContactedAt: app.whatsappContactedAt ? app.whatsappContactedAt.toISOString() : null,
  };
}

export function toProjectDTO(p: {
  id: string;
  applicationId: string;
  jobId: string;
  clientId: string;
  professionalId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  job?: { title: string } | null;
  client?: { name: string } | null;
  professional?: { name: string } | null;
}): ProjectDTO {
  return {
    id: p.id,
    applicationId: p.applicationId,
    jobId: p.jobId,
    jobTitle: p.job?.title ?? "",
    clientId: p.clientId,
    clientName: p.client?.name ?? "",
    professionalId: p.professionalId,
    professionalName: p.professional?.name ?? "",
    status: p.status as ProjectStatus,
    startedAt: p.startedAt.toISOString(),
    completedAt: p.completedAt ? p.completedAt.toISOString() : null,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function toReviewDTO(r: {
  id: string;
  projectId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewer?: { name: string } | null;
  reviewee?: { name: string } | null;
}): ReviewDTO {
  return {
    id: r.id,
    projectId: r.projectId,
    reviewerId: r.reviewerId,
    reviewerName: r.reviewer?.name ?? "",
    revieweeId: r.revieweeId,
    revieweeName: r.reviewee?.name ?? "",
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  };
}

export function toFavoriteDTO(
  f: { id: string; targetType: string; targetId: string; createdAt: Date },
  target: FavoriteJobSummary | FavoriteProfessionalSummary | null = null
): FavoriteDTO {
  return {
    id: f.id,
    targetType: f.targetType as FavoriteTargetType,
    targetId: f.targetId,
    createdAt: f.createdAt.toISOString(),
    target,
  };
}

export function toNotificationDTO(n: {
  id: string;
  type: string;
  title: string;
  message: string;
  meta?: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}): NotificationDTO {
  let meta: Record<string, string> | null = null;
  if (n.meta) {
    try {
      meta = JSON.parse(n.meta);
    } catch {
      meta = null;
    }
  }
  return {
    id: n.id,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    meta,
    link: n.link,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

export function toProfessionalProfileDTO(profile: {
  id: string;
  userId: string;
  title: string | null;
  bio: string | null;
  hourlyRate: number | null;
  experience: number | null;
  location: string | null;
  languages: string | null;
  availability: string;
  avatarUrl: string | null;
  profileComplete: boolean;
  user: { name: string; isWhatsapp: boolean; phoneNumber: string | null };
  skills: { skill: { name: string } }[];
  portfolio: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    projectUrl: string | null;
  }[];
}): ProfessionalProfileDTO {
  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.user.name,
    title: profile.title,
    bio: profile.bio,
    hourlyRate: profile.hourlyRate,
    experience: profile.experience,
    location: profile.location,
    languages: profile.languages ? profile.languages.split(",").filter(Boolean) : [],
    availability: profile.availability as Availability,
    avatarUrl: profile.avatarUrl,
    profileComplete: profile.profileComplete,
    skills: profile.skills.map((s) => s.skill.name),
    portfolio: profile.portfolio,
    whatsappAvailable: profile.user.isWhatsapp && !!profile.user.phoneNumber,
  };
}
