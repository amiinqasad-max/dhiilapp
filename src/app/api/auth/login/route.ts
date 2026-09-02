import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, signSessionToken, verifyPassword } from "@/lib/auth";
import { ApiException, withErrorHandling } from "@/lib/api-utils";
import { loginSchema, parseOrThrow } from "@/lib/validation";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body) throw new ApiException(400, "Invalid request body.");
  const data = parseOrThrow(loginSchema, body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  // Deliberately generic message — do not reveal whether the email exists.
  const genericError = "Invalid email or password.";
  if (!user || !user.isActive) throw new ApiException(401, genericError);

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) throw new ApiException(401, genericError);

  const token = signSessionToken({ sub: user.id, role: user.role });
  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
  });
});
