"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/marketplace/WhatsAppButton";
import { toast } from "@/components/ui/Misc";
import type { JobDTO, ProfessionalProfileDTO } from "@/types";

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<JobDTO | null>(null);
  const [portfolio, setPortfolio] = useState<ProfessionalProfileDTO["portfolio"]>([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [portfolioId, setPortfolioId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?next=/jobs/${id}/apply`);
      return;
    }
    if (user.role !== "PROFESSIONAL") {
      router.push(`/jobs/${id}`);
      return;
    }
    apiFetch<{ job: JobDTO }>(`/api/jobs/${id}`).then((d) => setJob(d.job));
    apiFetch<{ profile: ProfessionalProfileDTO }>("/api/profile").then((d) => setPortfolio(d.profile.portfolio));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = await apiFetch<{ application: { id: string }; whatsappLink: string | null }>(
        `/api/jobs/${id}/apply`,
        {
          method: "POST",
          body: JSON.stringify({
            coverLetter,
            proposedPrice: Number(proposedPrice),
            deliveryTime,
            portfolioId: portfolioId || undefined,
          }),
        }
      );
      setApplicationId(data.application.id);
      setWaLink(data.whatsappLink);
      toast("Application submitted.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to submit application.");
    } finally {
      setSaving(false);
    }
  }

  async function handleContinueOnWhatsApp() {
    if (!applicationId) return;
    // Best-effort tracking of the click — never blocks opening WhatsApp.
    apiFetch(`/api/applications/${applicationId}/whatsapp-contacted`, { method: "POST" }).catch(() => {});
  }

  if (applicationId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Application Ready</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your application was saved to DHIIL. Continue on WhatsApp to talk with the client directly.
        </p>
        <div className="mt-6 space-y-3">
          <WhatsAppButton link={waLink} fullWidth size="lg" onOpen={handleContinueOnWhatsApp} />
          <LinkButton href="/dashboard" variant="outline" fullWidth size="lg">
            Go to my applications
          </LinkButton>
        </div>
      </div>
    );
  }

  if (!job) return <div className="mx-auto max-w-lg px-4 py-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Apply to &ldquo;{job.title}&rdquo;</h1>
      <p className="mt-1 text-sm text-gray-500">Fill in your proposal. You&apos;ll continue on WhatsApp after this.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Textarea
          label="Cover letter"
          required
          minLength={20}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Introduce yourself and explain why you're a good fit…"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Proposed price (USD)"
            type="number"
            min={1}
            required
            value={proposedPrice}
            onChange={(e) => setProposedPrice(e.target.value)}
          />
          <Input
            label="Delivery time"
            required
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            placeholder="e.g. 5 days"
          />
        </div>
        {portfolio.length > 0 && (
          <Select label="Portfolio (optional)" value={portfolioId} onChange={(e) => setPortfolioId(e.target.value)}>
            <option value="">None</option>
            {portfolio.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" fullWidth size="lg" loading={saving}>
          Submit application
        </Button>
      </form>
    </div>
  );
}
