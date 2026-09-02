import { z } from "zod";
import { AVAILABILITIES, JOB_TYPES } from "@/types";
import { ApiException } from "@/lib/api-utils";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  role: z.enum(["CLIENT", "PROFESSIONAL"] as [string, ...string[]]),
  phoneCountry: z.string().length(2).optional(),
  phoneNumber: z.string().min(4).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required."),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  title: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  hourlyRate: z.number().nonnegative().max(1_000_000).optional(),
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
  budgetType: z.enum(JOB_TYPES as [string, ...string[]]).default("FIXED"),
  location: z.string().trim().max(120).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  deadline: z.string().datetime().optional().or(z.literal("")),
});

export const jobUpdateSchema = jobCreateSchema.partial().extend({
  status: z.enum(["OPEN", "CLOSED", "COMPLETED"]).optional(),
});

export const applicationCreateSchema = z.object({
  coverLetter: z.string().trim().min(20, "Cover letter must be at least 20 characters.").max(3000),
  proposedPrice: z.number().positive("Proposed price must be greater than 0.").max(10_000_000),
  deliveryTime: z.string().trim().min(1).max(60),
  portfolioId: z.string().uuid().optional(),
});

export const applicationStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "SHORTLISTED",
    "ACCEPTED",
    "REJECTED",
    "WITHDRAWN",
    "PROJECT",
    "COMPLETED",
    "REVIEWED",
  ]),
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
