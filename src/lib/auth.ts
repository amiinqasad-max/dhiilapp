import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  // Fail loudly at import time in any environment that actually serves
  // requests — never fall back to a hardcoded secret.
  if (process.env.NODE_ENV !== "test") {
    throw new Error("JWT_SECRET environment variable is not set");
  }
}

export const AUTH_COOKIE_NAME = "dhiil_session";

export interface SessionTokenPayload {
  sub: string; // user id
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(payload: SessionTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET || "test-secret", {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET || "test-secret");
    if (typeof decoded === "object" && decoded && "sub" in decoded && "role" in decoded) {
      const payload = decoded as jwt.JwtPayload & { role: unknown };
      return { sub: String(payload.sub), role: String(payload.role) };
    }
    return null;
  } catch {
    return null;
  }
}
