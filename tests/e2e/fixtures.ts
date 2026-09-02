import { test as base, expect } from "@playwright/test";

/**
 * Force English for deterministic text-based assertions across the suite
 * (DHIIL defaults to Somali — see src/lib/i18n/config.ts — which is
 * exercised separately by tests/i18n.test.ts). Setting the same cookie
 * the app's own LanguageSwitcher writes (`dhiil_lang`) is a real,
 * supported way to pick a language, not a test-only hack.
 */
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    const url = new URL(baseURL!);
    await context.addCookies([
      { name: "dhiil_lang", value: "en", domain: url.hostname, path: "/" },
    ]);
    await use(context);
  },
});

export { expect };

/** Generate a unique, valid-looking email per test run/actor. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}
