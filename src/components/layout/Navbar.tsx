"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) return null;

  const links = [
    { href: "/jobs", label: t("nav.findJobs") },
    { href: "/professionals", label: t("nav.findProfessionals") },
    ...(user?.role === "CLIENT" ? [{ href: "/jobs/new", label: t("nav.postJob") }] : []),
    ...(user ? [{ href: "/dashboard", label: t("nav.dashboard") }] : []),
    ...(user ? [{ href: "/projects", label: t("nav.projects") }] : []),
    ...(user ? [{ href: "/favorites", label: t("nav.favorites") }] : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: t("nav.admin") }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 hidden border-b border-black/[0.06] bg-[var(--background)]/80 backdrop-blur-xl safe-top md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={t("common.appName")} className="h-11 w-auto" />
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/activity" className="text-sm font-medium text-gray-600 hover:text-brand-700">
                {t("nav.activity")}
              </Link>
              <Link href="/profile" className="text-sm font-medium text-gray-600 hover:text-brand-700">
                {user.name}
              </Link>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                {t("common.logOut")}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand-700">
                {t("common.logIn")}
              </Link>
              <Link href="/register">
                <Button size="sm">{t("common.signUp")}</Button>
              </Link>
            </>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
