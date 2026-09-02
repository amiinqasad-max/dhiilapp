"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode, useEffect } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a "namespace.key" with optional {var} interpolation and
   * count-based pluralization (looks up `${key}_one` / `${key}_other`
   * first when `vars.count` is provided). Falls back to the key itself
   * (never to the other language) so a missing translation is obvious
   * rather than silently showing English while Somali is selected. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365; // 1 year — persists across sessions/PWA reopen.
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const dictionary: Dictionary = useMemo(() => getDictionary(locale), [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private-browsing contexts — cookie below still works.
    }
    setCookie(LOCALE_COOKIE, next);
    document.documentElement.lang = next;
  }, []);

  // Reconcile with localStorage on mount in case the client's stored
  // preference is newer than the cookie the server rendered with (e.g.
  // cookie was cleared but localStorage wasn't).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(stored) && stored !== locale) {
        setLocaleState(stored);
      }
    } catch {
      // ignore
    }
    document.documentElement.lang = locale;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      if (vars && typeof vars.count === "number") {
        const pluralKey = vars.count === 1 ? `${key}_one` : `${key}_other`;
        if (dictionary[pluralKey] !== undefined) {
          return interpolate(dictionary[pluralKey], vars);
        }
      }
      const template = dictionary[key];
      if (template === undefined) return key;
      return interpolate(template, vars);
    },
    [dictionary]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Convenience alias matching common i18n library naming. */
export function useTranslation() {
  const { t, locale, setLocale } = useI18n();
  return { t, locale, setLocale };
}

export { DEFAULT_LOCALE };
export type { Locale };
