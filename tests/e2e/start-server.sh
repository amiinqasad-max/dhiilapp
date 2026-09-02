#!/usr/bin/env bash
# Boots a throwaway Next.js production server for Playwright, backed by
# an isolated SQLite database — never the production Supabase Postgres
# instance. Mirrors the same "prisma/test/schema.prisma" strategy the
# Vitest suite already uses for exactly the same reason: this sandbox's
# network policy blocks direct egress to Supabase anyway, so a real
# browser-driven run against production is not even possible from here,
# and would be the wrong thing to do even if it were.
#
# Uses a production build + `next start` rather than `next dev`: the dev
# server's per-route JIT compilation and much larger unoptimized bundles
# caused intermittent multi-second stalls under this sandbox's limited
# CPU (a real flake source, not an application bug) — a prod server is
# also simply closer to what actually ships.
set -euo pipefail
cd "$(dirname "$0")/../.."

DB_DIR="$(pwd)/tests/e2e/.db"
DB_FILE="$DB_DIR/e2e.db"
mkdir -p "$DB_DIR"
rm -f "$DB_FILE" "$DB_FILE-journal"

# Absolute path — SQLite "file:" URLs are resolved differently by the
# Prisma CLI (relative to the schema file) vs. the generated Client at
# runtime (relative to process.cwd()); an absolute path sidesteps both.
export DATABASE_URL="file:$DB_FILE"
export JWT_SECRET="e2e-test-secret-not-for-production"
export JWT_EXPIRES_IN="1h"
export NEXT_PUBLIC_APP_URL="http://127.0.0.1:3100"
export NODE_ENV="production"

npx prisma generate --schema=prisma/test/schema.prisma
npx prisma db push --schema=prisma/test/schema.prisma --skip-generate --force-reset
npx next build

exec npx next start -p 3100
