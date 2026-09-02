"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) return null;

  const links = [
    { href: "/jobs", label: "Find Jobs" },
    { href: "/professionals", label: "Find Professionals" },
    ...(user?.role === "CLIENT" ? [{ href: "/jobs/new", label: "Post a Job" }] : []),
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 hidden border-b border-gray-200 bg-white/95 backdrop-blur safe-top md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">D</span>
          DHIIL
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
                Activity
              </Link>
              <Link href="/profile" className="text-sm font-medium text-gray-600 hover:text-brand-700">
                {user.name}
              </Link>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand-700">
                Log in
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
