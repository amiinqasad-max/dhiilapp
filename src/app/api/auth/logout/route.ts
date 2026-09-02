import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-utils";

export const POST = withErrorHandling(async () => {
  cookies().set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
});
