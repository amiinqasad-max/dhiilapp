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
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/[0.06] bg-[var(--background)]/80 px-4 py-2 backdrop-blur-xl safe-top md:hidden">
      <Link href="/" className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt={t("common.appName")} className="h-9 w-auto" />
      </Link>
      <LanguageSwitcher />
    </div>
  );
}
