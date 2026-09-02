import { describe, it, expect } from "vitest";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { translateApiError, ApiClientError } from "@/lib/api-client";

describe("i18n dictionaries", () => {
  it("defaults to Somali", () => {
    expect(DEFAULT_LOCALE).toBe("so");
  });

  it("supports Somali and English", () => {
    expect(LOCALES).toEqual(["so", "en"]);
  });

  it("every Somali key has an English counterpart and vice versa", () => {
    const so = getDictionary("so");
    const en = getDictionary("en");
    const soKeys = Object.keys(so).sort();
    const enKeys = Object.keys(en).sort();
    expect(soKeys).toEqual(enKeys);
  });

  it("no dictionary value is empty", () => {
    for (const locale of LOCALES) {
      const dict = getDictionary(locale);
      for (const [key, value] of Object.entries(dict)) {
        expect(value.length, `${locale}:${key} should not be empty`).toBeGreaterThan(0);
      }
    }
  });

  it("core navigation terms are translated distinctly per locale", () => {
    const so = getDictionary("so");
    const en = getDictionary("en");
    expect(so["nav.jobs"]).toBe("Shaqooyin");
    expect(en["nav.jobs"]).toBe("Jobs");
    expect(so["nav.jobs"]).not.toBe(en["nav.jobs"]);
  });

  it("WhatsApp wording never claims delivery in either locale", () => {
    for (const locale of LOCALES) {
      const dict = getDictionary(locale);
      const continueLabel = dict["whatsapp.continueOnWhatsapp"].toLowerCase();
      expect(continueLabel).not.toContain("sent");
      expect(continueLabel).not.toContain("delivered");
    }
  });
});

describe("translateApiError", () => {
  const so = getDictionary("so");
  function t(key: string) {
    return so[key] ?? key;
  }

  it("translates a known error code", () => {
    const err = new ApiClientError(409, "An account with this email already exists.", "EMAIL_TAKEN");
    expect(translateApiError(err, t)).toBe(so["errors.EMAIL_TAKEN"]);
  });

  it("falls back to a generic localized message for an unknown code", () => {
    const err = new ApiClientError(500, "boom", "SOME_UNKNOWN_CODE");
    expect(translateApiError(err, t)).toBe(so["errors.GENERIC_ERROR"]);
  });

  it("falls back to a generic localized message when there is no code at all", () => {
    const err = new Error("network down");
    expect(translateApiError(err, t)).toBe(so["errors.GENERIC_ERROR"]);
  });
});
