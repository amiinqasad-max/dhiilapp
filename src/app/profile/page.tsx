"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton, toast } from "@/components/ui/Misc";
import type { ProfessionalProfileDTO } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const { t } = useTranslation();
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
      toast(t("profile.saved"));
    } catch (err) {
      toast(translateApiError(err, t), "error");
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
      <h1 className="text-2xl font-bold text-gray-900">{t("profile.title")}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {user?.role === "PROFESSIONAL" ? t("profile.subtitleProfessional") : t("profile.subtitleClient")}
      </p>

      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <Input label={t("common.fullName")} value={name} onChange={(e) => setName(e.target.value)} required />

        <Card className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">{t("profile.whatsappContactHeading")}</p>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("profile.countryLabel")}
              value={phoneCountry}
              onChange={(e) => setPhoneCountry(e.target.value.toUpperCase())}
              maxLength={2}
              hint={t("profile.countryHint")}
              className="col-span-1"
            />
            <Input
              label={t("profile.phoneNumberLabel")}
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
            {t("profile.isWhatsappLabel")}
          </label>
        </Card>

        {user?.role === "PROFESSIONAL" && (
          <>
            <Input
              label={t("profile.professionalTitleLabel")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("profile.professionalTitlePlaceholder")}
            />
            <Textarea
              label={t("profile.bioLabel")}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("profile.bioPlaceholder")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("profile.hourlyRateLabel")}
                type="number"
                min={0}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
              <Input label={t("common.location")} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <Select label={t("profile.availabilityLabel")} value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="AVAILABLE">{t("professionals.availableStatus")}</option>
              <option value="BUSY">{t("professionals.busyStatus")}</option>
              <option value="UNAVAILABLE">{t("professionals.unavailableStatus")}</option>
            </Select>
            <Input
              label={t("profile.skillsFieldLabel")}
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder={t("profile.skillsFieldPlaceholder")}
            />
            {profile && !profile.profileComplete && (
              <p className="text-xs text-amber-600">{t("profile.incompleteWarning")}</p>
            )}
          </>
        )}

        <Button type="submit" fullWidth size="lg" loading={saving}>
          {t("profile.saveButton")}
        </Button>
      </form>
    </div>
  );
}
