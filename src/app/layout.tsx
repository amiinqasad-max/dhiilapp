import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import { Navbar } from "@/components/layout/Navbar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/Toaster";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${dict["common.appName"]} — ${dict["common.tagline"]}`,
      template: `%s | ${dict["common.appName"]}`,
    },
    description: dict["home.heroSubtitle"],
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "DHIIL",
    },
    icons: {
      icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      siteName: "DHIIL",
      locale: locale === "so" ? "so_SO" : "en_US",
      title: `${dict["common.appName"]} — ${dict["common.tagline"]}`,
      description: dict["home.heroSubtitle"],
    },
    alternates: {
      canonical: "/",
      languages: {
        so: "/",
        en: "/",
      },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#e95b18",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = getServerLocale();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="antialiased font-sans">
        <I18nProvider initialLocale={locale}>
          <AuthProvider>
            <ServiceWorkerRegister />
            <Toaster />
            <Navbar />
            <MobileTopBar />
            <main className="min-h-[calc(100vh-64px)] pb-bottom-nav md:pb-0">{children}</main>
            <Footer />
            <BottomNav />
            <InstallPrompt />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
