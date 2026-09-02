import { PrismaClient } from "@prisma/client";

// Vercel's Supabase integration auto-injects its own env var names
// (POSTGRES_PRISMA_URL, POSTGRES_URL, ...) rather than the DATABASE_URL
// our schema.prisma datasource actually reads. Fall back to the
// integration's Prisma-specific one so a Vercel deploy doesn't require
// manually duplicating the connection string under a second name.
if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
}

// Standard Next.js dev-mode singleton to avoid exhausting DB connections
// via hot-reload creating a new PrismaClient on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
