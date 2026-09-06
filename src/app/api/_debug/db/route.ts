import { NextResponse } from "next/server";

/**
 * TEMPORARY diagnostic endpoint — safe to hit publicly (leaks no secrets:
 * only which env var is active, its host/port/user, and whether a live
 * query succeeds). Added solely to debug the production DATABASE_URL
 * connectivity issue; delete once resolved.
 */
export const GET = async () => {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || "";
  const source = process.env.DATABASE_URL
    ? "DATABASE_URL"
    : process.env.POSTGRES_PRISMA_URL
    ? "POSTGRES_PRISMA_URL (fallback)"
    : "NONE SET";

  let parsed: Record<string, string | null> = {};
  try {
    const u = new URL(raw);
    parsed = {
      protocol: u.protocol,
      username: u.username || null,
      hostname: u.hostname,
      port: u.port || null,
      pathname: u.pathname,
    };
  } catch (e) {
    parsed = { parseError: e instanceof Error ? e.message : String(e) };
  }

  let queryResult: string;
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.user.count();
    queryResult = `OK, user count = ${count}`;
  } catch (e) {
    queryResult = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ source, parsed, queryResult, jwtSecretSet: Boolean(process.env.JWT_SECRET) });
};
