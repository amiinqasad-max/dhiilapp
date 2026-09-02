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
  execSync("npx prisma db push --skip-generate --force-reset", {
    cwd: path.resolve(__dirname, ".."),
    env: process.env,
    stdio: "pipe",
  });
});

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.rmSync(TEST_DB);
  const journal = `${TEST_DB}-journal`;
  if (fs.existsSync(journal)) fs.rmSync(journal);
});
