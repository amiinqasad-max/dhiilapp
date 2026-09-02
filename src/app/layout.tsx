import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Toaster } from "@/components/ui/Toaster";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "DHIIL — Find Work. Find Talent.",
    template: "%s | DHIIL",
  },
  description:
    "DHIIL is a marketplace that helps clients find the right professional and professionals find the right job — then connects you on WhatsApp to talk.",
  manifest: "/manifest.json",
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
    title: "DHIIL — Find Work. Find Talent.",
    description: "Discover jobs and professionals, then connect on WhatsApp.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0e8760",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ServiceWorkerRegister />
          <Toaster />
          <Navbar />
          <main className="min-h-[calc(100vh-64px)] pb-bottom-nav md:pb-0">{children}</main>
          <BottomNav />
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
