import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict["professionals.findProfessionalsTitle"],
    description: dict["professionals.findProfessionalsSubtitle"],
  };
}

export default function ProfessionalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
