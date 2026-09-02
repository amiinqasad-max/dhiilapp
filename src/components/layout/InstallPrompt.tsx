"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const DISMISS_KEY = "dhiil_install_dismissed_at";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Non-aggressive install banner. Only appears after the browser's own
 * `beforeinstallprompt` fires (so we're never guessing installability),
 * and only if the user hasn't dismissed it recently. Uses the browser's
 * native install mechanism — we never fabricate our own APK/IPA flow.
 */
export function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;
      setDeferredEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredEvent) return null;

  async function install() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-3 z-40 mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-lg safe-bottom" style={{ bottom: "calc(var(--bottom-nav-height) + 12px)" }}>
      <p className="text-sm font-semibold text-gray-900">Install DHIIL</p>
      <p className="mt-1 text-xs text-gray-500">
        Add DHIIL to your home screen for a faster, app-like experience.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={install}>
          Install
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}
