"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/marketplace/WhatsAppButton";
import { toast } from "@/components/ui/Misc";
import type { JobDTO } from "@/types";

export default function NewJobPage() {
  const { user, loading: authLoading } = useAuth();
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
      toast("Job published!");
      const link = await apiFetch<{ link: string }>(`/api/jobs/${data.job.id}/whatsapp-share-link`);
      setWaLink(link.link);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to publish job.");
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
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Job Published</h1>
        <p className="mt-1 text-sm text-gray-500">
          &ldquo;{published.title}&rdquo; is now searchable on DHIIL.
        </p>
        <div className="mt-6 space-y-3">
          <WhatsAppButton link={waLink} label="Share on WhatsApp" fullWidth size="lg" />
          <LinkButton href={`/jobs/${published.id}`} variant="outline" fullWidth size="lg">
            View job
          </LinkButton>
          <LinkButton href="/dashboard" variant="ghost" fullWidth>
            Go to dashboard
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Post a job</h1>
      <p className="mt-1 text-sm text-gray-500">Tell professionals what you need done.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label="Job title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design a logo for my bakery" />
        <Textarea label="Description" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the work, requirements, and expectations…" />
        <Input label="Category" required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Design, Writing, Development" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Budget (USD)" type="number" min={1} required value={budget} onChange={(e) => setBudget(e.target.value)} />
          <Select label="Budget type" value={budgetType} onChange={(e) => setBudgetType(e.target.value)}>
            <option value="FIXED">Fixed price</option>
            <option value="HOURLY">Hourly</option>
          </Select>
        </div>
        <Input label="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote, or a city" />
        <Input label="Skills needed" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Comma-separated, e.g. Figma, Illustrator" />
        <Input label="Deadline (optional)" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" fullWidth size="lg" loading={saving}>
          Publish job
        </Button>
      </form>
    </div>
  );
}
