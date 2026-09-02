"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton, toast } from "@/components/ui/Misc";
import type { ProfessionalProfileDTO } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfessionalProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("SO");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isWhatsapp, setIsWhatsapp] = useState(false);
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("AVAILABLE");
  const [skillsInput, setSkillsInput] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?next=/profile");
      return;
    }
    setName(user.name);
    setPhoneCountry(user.phoneCountry || "SO");
    setPhoneNumber(user.phoneNumber || "");
    setIsWhatsapp(user.isWhatsapp);

    if (user.role === "PROFESSIONAL") {
      apiFetch<{ profile: ProfessionalProfileDTO }>("/api/profile")
        .then((data) => {
          setProfile(data.profile);
          setTitle(data.profile.title || "");
          setBio(data.profile.bio || "");
          setHourlyRate(data.profile.hourlyRate?.toString() || "");
          setLocation(data.profile.location || "");
          setAvailability(data.profile.availability);
          setSkillsInput(data.profile.skills.join(", "));
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        phoneCountry,
        phoneNumber,
        isWhatsapp,
      };
      if (user?.role === "PROFESSIONAL") {
        Object.assign(payload, {
          title,
          bio,
          hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
          location,
          availability,
          skills: skillsInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }
      await apiFetch("/api/profile", { method: "PATCH", body: JSON.stringify(payload) });
      await refresh();
      toast("Profile saved.");
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-lg space-y-3 px-4 py-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Your profile</h1>
      <p className="mt-1 text-sm text-gray-500">
        {user?.role === "PROFESSIONAL"
          ? "Keep this up to date so clients can find and trust you."
          : "Clients contact professionals here; keep your WhatsApp number current too."}
      </p>

      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />

        <Card className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">WhatsApp contact</p>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Country"
              value={phoneCountry}
              onChange={(e) => setPhoneCountry(e.target.value.toUpperCase())}
              maxLength={2}
              hint="e.g. SO, US"
              className="col-span-1"
            />
            <Input
              label="Phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="col-span-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={isWhatsapp}
              onChange={(e) => setIsWhatsapp(e.target.checked)}
            />
            This number is on WhatsApp
          </label>
        </Card>

        {user?.role === "PROFESSIONAL" && (
          <>
            <Input label="Professional title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Graphic Designer" />
            <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell clients about your experience…" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Hourly rate (USD)" type="number" min={0} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
              <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <Select label="Availability" value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">Busy</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </Select>
            <Input
              label="Skills"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Comma-separated, e.g. Logo Design, Branding"
            />
            {profile && !profile.profileComplete && (
              <p className="text-xs text-amber-600">
                Add a title, bio, and at least one skill to complete your profile.
              </p>
            )}
          </>
        )}

        <Button type="submit" fullWidth size="lg" loading={saving}>
          Save profile
        </Button>
      </form>
    </div>
  );
}
