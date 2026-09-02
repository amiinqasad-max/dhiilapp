import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiException, getCurrentUser, requireRole, withErrorHandling } from "@/lib/api-utils";
import { jobCreateSchema, parseOrThrow } from "@/lib/validation";
import { toJobDTO } from "@/lib/mappers";

const PAGE_SIZE = 20;

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const location = searchParams.get("location")?.trim();
  const skill = searchParams.get("skill")?.trim();
  const budgetType = searchParams.get("budgetType")?.trim();
  const minBudget = searchParams.get("minBudget");
  const maxBudget = searchParams.get("maxBudget");
  const mine = searchParams.get("mine") === "true";
  const status = searchParams.get("status")?.trim() || (mine ? "ALL" : "OPEN");
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  const where: Prisma.JobWhereInput = {};

  if (mine) {
    // "My jobs" is only ever the authenticated caller's own jobs — never
    // a client id supplied by the request.
    const current = await getCurrentUser();
    if (!current || current.role !== "CLIENT") {
      throw new ApiException(401, "Log in as a client to view your jobs.", "UNAUTHENTICATED");
    }
    where.clientId = current.id;
  }

  if (status !== "ALL") where.status = status;
  if (category) where.category = { contains: category };
  if (location) where.location = { contains: location };
  if (skill) where.skills = { contains: skill };
  if (budgetType) where.budgetType = budgetType;
  if (minBudget || maxBudget) {
    where.budget = {
      ...(minBudget ? { gte: Number(minBudget) } : {}),
      ...(maxBudget ? { lte: Number(maxBudget) } : {}),
    };
  }
  if (q) {
    where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
  }

  const orderBy =
    sort === "budget_high"
      ? { budget: "desc" as const }
      : sort === "budget_low"
      ? { budget: "asc" as const }
      : { createdAt: "desc" as const };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { client: { select: { name: true } }, _count: { select: { applications: true } } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({
    jobs: jobs.map((j) => toJobDTO(j)),
    page,
    pageSize: PAGE_SIZE,
    total,
  });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireRole("CLIENT");
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(jobCreateSchema, body);

  const job = await prisma.job.create({
    data: {
      clientId: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      budget: data.budget,
      budgetType: data.budgetType,
      location: data.location || null,
      skills: data.skills && data.skills.length > 0 ? data.skills.join(",") : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
    include: { client: { select: { name: true } }, _count: { select: { applications: true } } },
  });

  return NextResponse.json({ job: toJobDTO(job) }, { status: 201 });
});
