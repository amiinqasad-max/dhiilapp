"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@/context/I18nContext";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

/**
 * Reusable language switcher — globe icon + current language, opens a
 * small popover to pick Somali/English. One component used everywhere
 * (header, home, dashboards, etc.) per the "single reusable component"
 * requirement. `prominent` renders the larger home-page treatment.
 */
export function LanguageSwitcher({ prominent = false }: { prominent?: boolean }) {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function choose(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  const current = LOCALE_LABELS[locale];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("nav.changeLanguage")}
        onClick={() => setOpen((v) => !v)}
        className={`tap-target inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
          prominent
            ? "border-white/30 bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/20"
            : "border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
        }`}
      >
        <GlobeIcon className={prominent ? "h-5 w-5" : "h-4 w-4"} />
        <span>{current.flag}</span>
        <span>{current.native}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="listbox"
          aria-label={t("nav.language")}
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {t("nav.language")}
          </p>
          {LOCALES.map((code) => {
            const label = LOCALE_LABELS[code];
            const active = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(code)}
                className={`tap-target flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:bg-gray-50 ${
                  active ? "font-semibold text-brand-700" : "text-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{label.flag}</span>
                  <span>{label.native}</span>
                </span>
                {active && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
