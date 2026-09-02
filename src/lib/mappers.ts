import type {
  ApplicationDTO,
  ApplicationStatus,
  JobDTO,
  JobStatus,
  JobType,
  NotificationDTO,
  NotificationType,
  ProfessionalProfileDTO,
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
    location: string | null;
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
    budgetType: job.budgetType as JobType,
    location: job.location,
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

export function toNotificationDTO(n: {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}): NotificationDTO {
  return {
    id: n.id,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
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
