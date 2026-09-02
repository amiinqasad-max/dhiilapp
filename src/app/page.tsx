import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 text-white sm:py-14">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
          Find the right person. Find the right job.
        </h1>
        <p className="mt-3 max-w-md text-brand-50">
          DHIIL helps clients and professionals discover each other — then connects you on WhatsApp to talk.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/jobs" variant="secondary" size="lg">
            Find Jobs
          </LinkButton>
          <LinkButton href="/professionals" size="lg" className="!bg-white !text-brand-800 hover:!bg-brand-50">
            Find Professionals
          </LinkButton>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FeatureCard
          title="Post a job"
          description="Describe what you need, publish it, and share it on WhatsApp."
          href="/jobs/new"
          cta="Post a job"
        />
        <FeatureCard
          title="Build your profile"
          description="Show your skills, portfolio, and experience to clients."
          href="/register"
          cta="Get started"
        />
        <FeatureCard
          title="Apply & connect"
          description="Apply to jobs, then continue the conversation on WhatsApp."
          href="/jobs"
          cta="Browse jobs"
        />
      </section>

      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">How DHIIL works</h2>
        <ol className="mt-3 space-y-2 text-sm text-gray-600">
          <li>1. Clients post jobs, professionals build profiles.</li>
          <li>2. Professionals apply — DHIIL saves the application and notifies the client.</li>
          <li>3. Clients review, shortlist, and accept applicants.</li>
          <li>4. Either side continues the conversation on WhatsApp.</li>
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
