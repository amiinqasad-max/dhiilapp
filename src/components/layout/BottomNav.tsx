"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z" />
    </svg>
  );
}
function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" {...props}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path strokeLinecap="round" d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5M3 12.5h18" />
    </svg>
  );
}
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" d="M2.5 20a6.5 6.5 0 0 1 13 0M16 8.5a3 3 0 1 1 3.5 2.96M15.5 14a6.5 6.5 0 0 1 6 6" />
    </svg>
  );
}
function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17s-2.5-1.5-2.5-8Z" />
      <path strokeLinecap="round" d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();

  const items = [
    { href: "/", label: t("nav.home"), icon: HomeIcon },
    { href: "/jobs", label: t("nav.jobs"), icon: BriefcaseIcon },
    { href: "/professionals", label: t("nav.professionals"), icon: UsersIcon },
    ...(user ? [{ href: "/activity", label: t("nav.activity"), icon: BellIcon }] : []),
    { href: user ? "/profile" : "/login", label: user ? t("nav.profile") : t("common.logIn"), icon: UserIcon },
  ];

  // Hide chrome on auth pages to keep those flows focused.
  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/[0.06] bg-[var(--background)]/90 backdrop-blur-xl safe-bottom md:hidden"
      style={{ height: "var(--bottom-nav-height)" }}
      aria-label={t("nav.home")}
    >
      <ul className="mx-auto flex h-full max-w-md items-stretch justify-between px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 tap-target text-[11px] font-medium ${
                  active ? "text-brand-700" : "text-gray-500"
                }`}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
