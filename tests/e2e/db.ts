import path from "path";
import { PrismaClient } from "@prisma/client";

// Direct read access to the same isolated SQLite database the E2E web
// server writes to (see start-server.sh) — used only to assert real
// database state after a UI action, never to set up test data in place
// of driving the browser. Absolute path, same reasoning as tests/setup.ts.
const DB_FILE = path.resolve(__dirname, ".db/e2e.db");

export const db = new PrismaClient({
  datasources: { db: { url: `file:${DB_FILE}` } },
});
