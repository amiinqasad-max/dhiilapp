"use client";

import Link from "next/link";
import { useTranslation } from "@/context/I18nContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

/**
 * Compact mobile-only top bar so the language switcher (and brand) stay
 * reachable from every screen on mobile, not just the desktop Navbar.
 */
export function MobileTopBar() {
  const { t } = useTranslation();
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-2 backdrop-blur safe-top md:hidden">
      <Link href="/" className="flex items-center gap-1.5 text-base font-extrabold tracking-tight text-brand-700">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-xs text-white">D</span>
        {t("common.appName")}
      </Link>
      <LanguageSwitcher />
    </div>
  );
}
