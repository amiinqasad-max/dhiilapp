"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useTranslation } from "@/context/I18nContext";
import { toast } from "@/components/ui/Misc";
import type { FavoriteDTO, FavoriteTargetType } from "@/types";

/**
 * Save/unsave toggle for a Job or Professional. Renders nothing until the
 * initial GET resolves (avoids a flash of the wrong state), then updates
 * optimistically on click with a rollback if the API call fails — never
 * relies on local state alone as the source of truth (a page refresh
 * always re-derives from GET /api/favorites).
 */
export function FavoriteButton({
  targetType,
  targetId,
  savedLabelKey,
  unsavedLabelKey,
  toastSavedKey,
  toastRemovedKey,
}: {
  targetType: FavoriteTargetType;
  targetId: string;
  savedLabelKey: string;
  unsavedLabelKey: string;
  toastSavedKey: string;
  toastRemovedKey: string;
}) {
  const { t } = useTranslation();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ favorites: FavoriteDTO[] }>(`/api/favorites?targetType=${targetType}`)
      .then((d) => {
        if (!cancelled) setSaved(d.favorites.some((f) => f.targetId === targetId));
      })
      .catch(() => {
        if (!cancelled) setSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  async function toggle() {
    if (busy || saved === null) return;
    const next = !saved;
    setSaved(next); // optimistic
    setBusy(true);
    try {
      if (next) {
        await apiFetch("/api/favorites", { method: "POST", body: JSON.stringify({ targetType, targetId }) });
        toast(t(toastSavedKey));
      } else {
        await apiFetch(`/api/favorites?targetType=${targetType}&targetId=${targetId}`, { method: "DELETE" });
        toast(t(toastRemovedKey));
      }
    } catch {
      setSaved(!next); // rollback
      toast(t("errors.GENERIC_ERROR"), "error");
    } finally {
      setBusy(false);
    }
  }

  if (saved === null) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={t(saved ? unsavedLabelKey : savedLabelKey)}
      className="tap-target inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
    >
      <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
      {t(saved ? unsavedLabelKey : savedLabelKey)}
    </button>
  );
}
