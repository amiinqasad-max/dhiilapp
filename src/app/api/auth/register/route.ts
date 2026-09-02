import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, hashPassword, signSessionToken } from "@/lib/auth";
import { ApiException, withErrorHandling } from "@/lib/api-utils";
import { registerSchema, parseOrThrow } from "@/lib/validation";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.", "VALIDATION_ERROR");
  const data = parseOrThrow(registerSchema, body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ApiException(409, "An account with this email already exists.", "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      phoneCountry: data.phoneCountry,
      phoneNumber: data.phoneNumber,
    },
  });

  // Professionals get an empty profile shell immediately so /profile and
  // /api/profile can always assume one exists for their role.
  if (data.role === "PROFESSIONAL") {
    await prisma.professionalProfile.create({ data: { userId: user.id } });
  }

  const token = signSessionToken({ sub: user.id, role: user.role });
  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
});
