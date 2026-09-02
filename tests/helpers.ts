import type { NextRequest } from "next/server";
import { cookieStore } from "./mocks/next-headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

const BASE = "http://localhost:3000";

/** Build a request compatible with our route handlers (they only rely on
 * standard Request/NextRequest members: .json(), .url, .method) without
 * pulling in the full Next.js server runtime. */
export function makeRequest(path: string, init?: RequestInit): NextRequest {
  const req = new Request(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  return req as unknown as NextRequest;
}

/** Snapshot the current mock session cookie (simulates "logging out" one
 * browser and remembering its token so tests can switch between multiple
 * simulated users). */
export function captureSession(): string | undefined {
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

/** Make a later call act as the given previously-captured session. */
export function actAs(token: string | undefined) {
  if (token === undefined) {
    cookieStore.delete(AUTH_COOKIE_NAME);
  } else {
    cookieStore.set(AUTH_COOKIE_NAME, { value: token });
  }
}

/** Clear the simulated browser's cookies (logged-out state). */
export function actAsGuest() {
  cookieStore.clear();
}

export async function readJson(res: Response) {
  return res.json();
}
