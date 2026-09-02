"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/marketplace/WhatsAppButton";
import { toast } from "@/components/ui/Misc";
import type { JobDTO } from "@/types";

export default function NewJobPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState("FIXED");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState<JobDTO | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/login?next=/jobs/new");
    else if (user.role !== "CLIENT") router.push("/jobs");
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        category,
        budget: Number(budget),
        budgetType,
        location: location || undefined,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      };
      const data = await apiFetch<{ job: JobDTO }>("/api/jobs", { method: "POST", body: JSON.stringify(payload) });
      setPublished(data.job);
      toast(t("jobs.publishedTitle"));
      const link = await apiFetch<{ link: string }>(`/api/jobs/${data.job.id}/whatsapp-share-link`);
      setWaLink(link.link);
    } catch (err) {
      setError(translateApiError(err, t));
    } finally {
      setSaving(false);
    }
  }

  if (published) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("jobs.publishedTitle")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("jobs.publishedDesc", { title: published.title })}</p>
        <div className="mt-6 space-y-3">
          <WhatsAppButton link={waLink} label={t("whatsapp.shareOnWhatsapp")} fullWidth size="lg" />
          <LinkButton href={`/jobs/${published.id}`} variant="outline" fullWidth size="lg">
            {t("jobs.viewJob")}
          </LinkButton>
          <LinkButton href="/dashboard" variant="ghost" fullWidth>
            {t("common.goToDashboard")}
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("jobs.postJobTitle")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("jobs.postJobSubtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label={t("jobs.titleLabel")}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("jobs.titlePlaceholder")}
        />
        <Textarea
          label={t("jobs.descriptionLabel")}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("jobs.descriptionPlaceholder")}
        />
        <Input
          label={t("jobs.categoryLabel")}
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={t("jobs.categoryFieldPlaceholder")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("jobs.budgetLabel")} type="number" min={1} required value={budget} onChange={(e) => setBudget(e.target.value)} />
          <Select label={t("jobs.budgetTypeLabel")} value={budgetType} onChange={(e) => setBudgetType(e.target.value)}>
            <option value="FIXED">{t("jobs.budgetTypeFixed")}</option>
            <option value="HOURLY">{t("jobs.budgetTypeHourly")}</option>
          </Select>
        </div>
        <Input
          label={t("jobs.locationOptionalLabel")}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t("jobs.locationPlaceholder")}
        />
        <Input
          label={t("jobs.skillsNeededLabel")}
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder={t("jobs.skillsPlaceholder")}
        />
        <Input label={t("jobs.deadlineOptionalLabel")} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" fullWidth size="lg" loading={saving}>
          {t("jobs.publishButton")}
        </Button>
      </form>
    </div>
  );
}
