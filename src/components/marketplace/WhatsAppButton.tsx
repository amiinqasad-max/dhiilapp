"use client";

import { Button } from "@/components/ui/Button";

/**
 * Renders a WhatsApp CTA that opens wa.me with a pre-filled message. Only
 * ever appears when `link` is non-null (i.e. the recipient has a valid,
 * normalized WhatsApp-capable number) — callers must not fabricate a link.
 * Wording is always "Continue on WhatsApp" style, never "message sent".
 */
export function WhatsAppButton({
  link,
  label = "Continue on WhatsApp",
  fullWidth,
  size = "md",
  onOpen,
}: {
  link: string | null;
  label?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  onOpen?: () => void;
}) {
  if (!link) {
    return (
      <Button variant="outline" size={size} fullWidth={fullWidth} disabled>
        WhatsApp not available
      </Button>
    );
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onOpen?.()}
      className={fullWidth ? "block w-full" : "inline-block"}
    >
      <Button variant="whatsapp" size={size} fullWidth={fullWidth} type="button">
        <WhatsAppIcon />
        {label}
      </Button>
    </a>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.44 5.13L2 22l5.13-1.55a9.9 9.9 0 0 0 4.91 1.3h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.16-4.94-4.35-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2 .9 2.15.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.2.72-.84.92-1.13.2-.29.39-.24.66-.14.27.1 1.7.8 1.99.95.29.15.48.22.55.35.07.13.07.75-.17 1.42z" />
    </svg>
  );
}
