import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { vi, beforeAll, afterAll } from "vitest";

const TEST_DB = path.resolve(__dirname, "test.db");

process.env.DATABASE_URL = `file:${TEST_DB}`;
process.env.JWT_SECRET = "test-secret-for-vitest-only";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
// NODE_ENV is already "test" under Vitest and is read-only to assign directly.

vi.mock("next/headers", () => import("./mocks/next-headers"));

beforeAll(() => {
  if (fs.existsSync(TEST_DB)) fs.rmSync(TEST_DB);
  const cwd = path.resolve(__dirname, "..");
  // Production (prisma/schema.prisma) targets Postgres/Supabase, which this
  // sandbox's network policy can't reach directly. The test suite instead
  // runs the exact same models against a local SQLite file.
  //
  // IMPORTANT: the @prisma/client package must already be generated from
  // prisma/test/schema.prisma *before* Vitest starts (see the "pretest"
  // npm script) — the shared `prisma` singleton (src/lib/prisma.ts) gets
  // constructed from whatever client code is on disk the first time any
  // test file imports it, which can happen during Vitest's collection
  // phase, before this beforeAll runs. Regenerating the client here would
  // be too late for files whose module graph already loaded the old
  // (Postgres-flavored) client. Only `db push` (schema, not code) is safe
  // to repeat per test file.
  execSync("npx prisma db push --schema=prisma/test/schema.prisma --skip-generate --force-reset", {
    cwd,
    env: process.env,
    stdio: "pipe",
  });
});

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.rmSync(TEST_DB);
  const journal = `${TEST_DB}-journal`;
  if (fs.existsSync(journal)) fs.rmSync(journal);
});
