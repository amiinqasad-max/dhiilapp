import { z } from "zod";
import {
  AVAILABILITIES,
  JOB_BUDGET_TYPES,
  JOB_TYPES,
  JOB_STATUSES,
  APPLICATION_STATUSES,
  PROJECT_STATUSES,
  FAVORITE_TARGET_TYPES,
  REPORT_TARGET_TYPES,
} from "@/types";
import { ApiException } from "@/lib/api-utils";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  role: z.enum(["CLIENT", "PROFESSIONAL"] as [string, ...string[]]),
  country: z.string().trim().max(100).optional(),
  phoneCountry: z.string().length(2).optional(),
  phoneNumber: z.string().min(4).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required."),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  country: z.string().trim().max(100).optional(),
  title: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  hourlyRate: z.number().nonnegative().max(1_000_000).optional(),
  experience: z.number().int().nonnegative().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  languages: z.array(z.string().trim().max(40)).max(20).optional(),
  availability: z.enum(AVAILABILITIES as [string, ...string[]]).optional(),
  avatarUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  phoneCountry: z.string().length(2).optional(),
  phoneNumber: z.string().min(4).max(20).optional(),
  isWhatsapp: z.boolean().optional(),
});

export const portfolioItemSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional(),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  projectUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export const jobCreateSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(150),
  description: z.string().trim().min(20, "Description must be at least 20 characters.").max(5000),
  category: z.string().trim().min(2).max(60),
  budget: z.number().positive("Budget must be greater than 0.").max(10_000_000),
  budgetType: z.enum(JOB_BUDGET_TYPES as [string, ...string[]]).default("FIXED"),
  jobType: z.enum(JOB_TYPES as [string, ...string[]]).default("ONE_TIME"),
  location: z.string().trim().max(120).optional(),
  remote: z.boolean().default(true),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  deadline: z.string().datetime().optional().or(z.literal("")),
});

export const jobUpdateSchema = jobCreateSchema.partial().extend({
  status: z.enum(JOB_STATUSES as [string, ...string[]]).optional(),
});

export const applicationCreateSchema = z.object({
  coverLetter: z.string().trim().min(20, "Cover letter must be at least 20 characters.").max(3000),
  proposedPrice: z.number().positive("Proposed price must be greater than 0.").max(10_000_000),
  deliveryTime: z.string().trim().min(1).max(60),
  portfolioId: z.string().uuid().optional(),
});

export const applicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES as [string, ...string[]]),
});

export const projectStatusSchema = z.object({
  status: z.enum(PROJECT_STATUSES as [string, ...string[]]),
  notes: z.string().trim().max(2000).optional(),
});

export const reviewCreateSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1.").max(5, "Rating must be at most 5."),
  comment: z.string().trim().max(2000).optional(),
});

export const favoriteCreateSchema = z.object({
  targetType: z.enum(FAVORITE_TARGET_TYPES as [string, ...string[]]),
  targetId: z.string().uuid(),
});

export const reportCreateSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES as [string, ...string[]]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(10).max(1000),
});

/** Parse + throw a friendly, safe message on failure (no zod internals leaked). */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    const message = first ? `${first.path.join(".") || "value"}: ${first.message}` : "Invalid input.";
    throw new ApiException(400, message, "VALIDATION_ERROR");
  }
  return result.data;
}
