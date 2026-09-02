import { defineConfig, devices } from "@playwright/test";

// Real browser-level E2E, run against a throwaway Next.js dev server on an
// isolated SQLite database (see tests/e2e/start-server.sh) — never the
// production Supabase Postgres instance. Tests drive the actual rendered
// UI (clicks, form fills, navigation) and verify server responses; several
// specs additionally query the database file directly to confirm real
// state changes, matching the "verify the actual database" requirement.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false, // specs share one seeded database and must not race
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" },
      },
    },
  ],
  webServer: {
    command: "bash tests/e2e/start-server.sh",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
