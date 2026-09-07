import type { MetadataRoute } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";

// A dynamic Web App Manifest (Next.js metadata file convention) so the
// installed app's name/description match the visitor's persisted
// language preference — the manifest itself follows the same cookie the
// rest of the app reads (see src/lib/i18n).
export default function manifest(): MetadataRoute.Manifest {
  const locale = getServerLocale();
  const dict = getDictionary(locale);

  return {
    name: `${dict["common.appName"]} — ${dict["common.tagline"]}`,
    short_name: dict["common.appName"],
    description: dict["home.heroSubtitle"],
    start_url: "/?source=pwa",
    id: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#f6f2ec",
    theme_color: "#e95b18",
    orientation: "portrait-primary",
    lang: locale,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
