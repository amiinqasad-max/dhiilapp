// DHIIL i18n configuration. Kept deliberately framework-agnostic (plain
// constants + JSON dictionaries) so a future native client (Android/iOS/
// React Native/Expo) can reuse the same locale files and key structure.

export const LOCALES = ["so", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "so";

export const LOCALE_COOKIE = "dhiil_lang";
export const LOCALE_STORAGE_KEY = "dhiil_lang";

export const LOCALE_LABELS: Record<Locale, { native: string; flag: string; english: string }> = {
  so: { native: "Soomaali", flag: "🇸🇴", english: "Somali" },
  en: { native: "English", flag: "🇬🇧", english: "English" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
