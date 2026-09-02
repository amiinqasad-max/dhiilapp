import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict["jobs.findJobsTitle"],
    description: dict["jobs.findJobsSubtitle"],
  };
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
