"use client";

import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { useTranslation } from "@/context/I18nContext";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="rounded-4xl border border-black/5 bg-white/70 px-6 py-10 shadow-card sm:py-14">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">
          {t("home.heroEyebrow")}
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl">
          {t("home.heroTitle")}
        </h1>
        <p className="mt-4 max-w-md text-gray-500">{t("home.heroSubtitle")}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/jobs" size="lg">
            {t("home.ctaFindJobs")}
          </LinkButton>
          <LinkButton href="/professionals" variant="secondary" size="lg">
            {t("home.ctaFindProfessionals")}
          </LinkButton>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FeatureCard
          title={t("home.featurePostTitle")}
          description={t("home.featurePostDesc")}
          href="/jobs/new"
          cta={t("home.featurePostCta")}
        />
        <FeatureCard
          title={t("home.featureProfileTitle")}
          description={t("home.featureProfileDesc")}
          href="/register"
          cta={t("home.featureProfileCta")}
        />
      </section>

      <section className="mt-10 rounded-4xl border border-black/5 bg-white/70 p-6 shadow-card">
        <h2 className="text-lg font-bold tracking-tight text-ink">{t("home.howItWorksTitle")}</h2>
        <ol className="mt-4 space-y-3 text-sm text-gray-500">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
              1
            </span>
            {t("home.howItWorksStep1")}
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
              2
            </span>
            {t("home.howItWorksStep2")}
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
              3
            </span>
            {t("home.howItWorksStep3")}
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
              4
            </span>
            {t("home.howItWorksStep4")}
          </li>
        </ol>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/90 p-5 shadow-card">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <Link href={href} className="mt-3 inline-block text-sm font-semibold text-brand-700">
        {cta} →
      </Link>
    </div>
  );
}
