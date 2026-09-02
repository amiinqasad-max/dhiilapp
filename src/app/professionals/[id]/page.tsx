"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { WhatsAppButton } from "@/components/marketplace/WhatsAppButton";
import { ErrorState, Skeleton } from "@/components/ui/Misc";
import { useAuth } from "@/context/AuthContext";
import type { ProfessionalProfileDTO } from "@/types";

export default function ProfessionalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfileDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ professional: ProfessionalProfileDTO }>(`/api/professionals/${id}`)
      .then((data) => setProfile(data.professional))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load profile."));
  }, [id]);

  useEffect(() => {
    if (!user || !profile?.whatsappAvailable) return;
    apiFetch<{ link: string | null }>(`/api/professionals/${id}/whatsapp-link`)
      .then((data) => setWaLink(data.link))
      .catch(() => setWaLink(null));
  }, [user, profile, id]);

  if (error) return <div className="mx-auto max-w-3xl px-4 py-6"><ErrorState message={error} /></div>;
  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            profile.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-sm text-gray-500">{profile.title || "Professional on DHIIL"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {profile.location && <span>{profile.location}</span>}
            <span className="capitalize">{profile.availability.toLowerCase()}</span>
            {profile.hourlyRate != null && <span className="font-semibold text-brand-700">${profile.hourlyRate}/hr</span>}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {user ? (
          <WhatsAppButton link={waLink} label="Contact on WhatsApp" fullWidth />
        ) : (
          <a href={`/login?next=/professionals/${id}`} className="block w-full rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-medium text-white">
            Log in to contact on WhatsApp
          </a>
        )}
      </div>

      {profile.bio && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">About</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{profile.bio}</p>
        </section>
      )}

      {profile.skills.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">Skills</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <span key={s} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {profile.portfolio.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">Portfolio</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profile.portfolio.map((p) => (
              <a
                key={p.id}
                href={p.projectUrl || "#"}
                target={p.projectUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 p-3 hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-900">{p.title}</p>
                {p.description && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{p.description}</p>}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
