import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import type { Role } from "@/types";

/** Thrown by service/API code for a condition that must map to a specific
 * HTTP status + safe, user-facing message. Never let a raw Error/db error
 * reach the client — always throw or catch into an ApiException.
 *
 * `code` is a stable, machine-readable identifier (see the errors.json
 * locale files under src/lib/i18n/locales) that the client uses to render
 * a localized message instead of `message`, which stays English as a
 * server-side/debug fallback only. */
export class ApiException extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code: string = "GENERIC_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function jsonError(status: number, message: string, code?: string) {
  return NextResponse.json({ error: message, code: code || "GENERIC_ERROR" }, { status });
}

/** Wrap a route handler so thrown ApiException -> proper JSON response, and
 * any unexpected error is logged server-side but never leaked to the client. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic route-handler signatures (params vary per route) require `any` here.
export function withErrorHandling<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiException) {
        return jsonError(err.status, err.message, err.code);
      }
      console.error("Unhandled API error:", err);
      return jsonError(500, "Something went wrong. Please try again.", "GENERIC_ERROR");
    }
  }) as T;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  isActive: boolean;
}

/** Resolve the authenticated user strictly from the verified, server-signed
 * session cookie — never from any client-supplied id/role field. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    name: user.name,
    isActive: user.isActive,
  };
}

/** Require any authenticated user; throws 401 otherwise. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiException(401, "Authentication required.", "UNAUTHENTICATED");
  return user;
}

/** Require an authenticated user with one of the given roles; throws
 * 401/403 otherwise. Role is always read from the server session, never
 * from request input. */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ApiException(403, "You do not have permission to perform this action.", "FORBIDDEN");
  }
  return user;
}
