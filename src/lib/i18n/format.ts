import type { Locale } from "./config";

// Intl locale tags. "so" (Somali) is a valid BCP-47 tag; environments
// without Somali ICU data fall back to a reasonable default automatically
// via Intl's locale negotiation — this never throws.
const INTL_LOCALE: Record<Locale, string> = {
  so: "so-SO",
  en: "en-US",
};

export function formatDate(value: Date | string, locale: Locale, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === "string" ? new Date(value) : value;
  try {
    return new Intl.DateTimeFormat(INTL_LOCALE[locale], opts ?? { year: "numeric", month: "short", day: "numeric" }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export function formatDateTime(value: Date | string, locale: Locale): string {
  return formatDate(value, locale, { dateStyle: "medium", timeStyle: "short" } as Intl.DateTimeFormatOptions);
}

export function formatNumber(value: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(INTL_LOCALE[locale]).format(value);
  } catch {
    return String(value);
  }
}

export function formatCurrency(value: number, locale: Locale, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(INTL_LOCALE[locale], { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `$${value.toLocaleString()}`;
  }
}
