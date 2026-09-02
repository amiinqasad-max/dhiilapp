"use client";

import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { useTranslation } from "@/context/I18nContext";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 text-white sm:py-14">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{t("home.heroTitle")}</h1>
        <p className="mt-3 max-w-md text-brand-50">{t("home.heroSubtitle")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/jobs" variant="secondary" size="lg">
            {t("home.ctaFindJobs")}
          </LinkButton>
          <LinkButton href="/professionals" size="lg" className="!bg-white !text-brand-800 hover:!bg-brand-50">
            {t("home.ctaFindProfessionals")}
          </LinkButton>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <FeatureCard
          title={t("home.featureApplyTitle")}
          description={t("home.featureApplyDesc")}
          href="/jobs"
          cta={t("home.featureApplyCta")}
        />
      </section>

      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">{t("home.howItWorksTitle")}</h2>
        <ol className="mt-3 space-y-2 text-sm text-gray-600">
          <li>1. {t("home.howItWorksStep1")}</li>
          <li>2. {t("home.howItWorksStep2")}</li>
          <li>3. {t("home.howItWorksStep3")}</li>
          <li>4. {t("home.howItWorksStep4")}</li>
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <Link href={href} className="mt-3 inline-block text-sm font-semibold text-brand-700">
        {cta} →
      </Link>
    </div>
  );
}
