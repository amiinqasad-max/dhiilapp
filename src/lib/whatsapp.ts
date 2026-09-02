// DHIIL WhatsApp Service — the single, centralized place for
// phone-number normalization, message encoding, and WhatsApp
// click-to-chat URL generation. Every WhatsApp CTA in the app must go
// through this module — never build a wa.me URL by hand elsewhere.
//
// IMPORTANT: opening this link only opens a compose window in
// WhatsApp. It is never proof of delivery or reading — callers must use
// wording like "Continue on WhatsApp" / "WhatsApp opened", never
// "Message sent" or "Message delivered".
//
// Message SCAFFOLDING (labels, headers, greetings) is localized via the
// same JSON dictionaries the UI uses — see src/lib/i18n. USER-GENERATED
// CONTENT (job titles/descriptions, cover letters, bios) is never
// translated and is inserted verbatim, per DHIIL's rule that only
// interface text changes with language, never a user's own words.

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

export interface NormalizedPhone {
  e164: string; // e.g. "+252611234567"
  digitsOnly: string; // e.g. "252611234567" (what wa.me expects)
}

/**
 * Normalize a raw phone number + ISO country code into E.164 form.
 * Returns null if the number cannot be parsed as valid — callers should
 * treat that as "no WhatsApp contact available" rather than guessing.
 */
export function normalizePhoneNumber(
  rawNumber: string | null | undefined,
  countryCode: string | null | undefined
): NormalizedPhone | null {
  if (!rawNumber) return null;
  try {
    const parsed = parsePhoneNumberFromString(
      rawNumber,
      (countryCode as CountryCode) || undefined
    );
    if (!parsed || !parsed.isValid()) return null;
    const e164 = parsed.number; // "+countrydigits"
    return { e164, digitsOnly: e164.replace(/^\+/, "") };
  } catch {
    return null;
  }
}

/**
 * Build a WhatsApp click-to-chat URL. Message is safely URL-encoded by
 * `encodeURIComponent` — raw user input is never interpolated unescaped.
 * Returns null if the phone number cannot be normalized to a valid
 * WhatsApp-capable number.
 */
export function generateWhatsAppLink(
  rawNumber: string | null | undefined,
  countryCode: string | null | undefined,
  message: string
): string | null {
  const normalized = normalizePhoneNumber(rawNumber, countryCode);
  if (!normalized) return null;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalized.digitsOnly}?text=${encodedMessage}`;
}

/**
 * Build a WhatsApp share link with no fixed recipient — opens WhatsApp's
 * own contact/group picker with the message pre-filled. Used for "Share
 * on WhatsApp" actions (e.g. a client sharing a job) where there is no
 * single destination number.
 */
export function generateWhatsAppShareLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function line(label: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `${label}:\n${value}\n\n`;
}

export const WhatsAppTemplates = {
  /** Professional -> Client, sent alongside a saved job application. */
  application(
    params: {
      jobTitle: string;
      category: string;
      professionalName: string;
      skills: string[];
      proposedPrice: number;
      deliveryTime: string;
      coverLetter: string;
      portfolioUrl?: string | null;
      applicationUrl: string;
    },
    locale: Locale = DEFAULT_LOCALE
  ): string {
    const t = getDictionary(locale);
    return (
      `${t["whatsapp.applicationIntro"]}\n\n` +
      `${t["whatsapp.applicationHeader"]}\n\n` +
      line(t["whatsapp.labelJob"], params.jobTitle) +
      line(t["whatsapp.labelCategory"], params.category) +
      line(t["whatsapp.labelProfessional"], params.professionalName) +
      line(t["whatsapp.labelSkills"], params.skills.join(", ")) +
      line(t["whatsapp.labelProposedPrice"], params.proposedPrice) +
      line(t["whatsapp.labelDeliveryTime"], params.deliveryTime) +
      line(t["whatsapp.labelCoverLetter"], params.coverLetter) +
      (params.portfolioUrl ? line(t["whatsapp.labelPortfolio"], params.portfolioUrl) : "") +
      line(t["whatsapp.labelApplicationLink"], params.applicationUrl) +
      t["whatsapp.thankYou"]
    ).trim();
  },

  /** Client sharing a newly published job to their own WhatsApp contacts. */
  jobShare(
    params: {
      jobTitle: string;
      category: string;
      budget: string;
      location?: string | null;
      shortDescription: string;
      skills: string[];
      jobUrl: string;
    },
    locale: Locale = DEFAULT_LOCALE
  ): string {
    const t = getDictionary(locale);
    return (
      `${t["whatsapp.jobShareHeader"]}\n\n` +
      line(t["whatsapp.labelJob"], params.jobTitle) +
      line(t["whatsapp.labelCategory"], params.category) +
      line(t["whatsapp.labelBudget"], params.budget) +
      (params.location ? line(t["whatsapp.labelLocation"], params.location) : "") +
      line(t["whatsapp.labelDescription"], params.shortDescription) +
      line(t["whatsapp.labelSkills"], params.skills.join(", ")) +
      line(t["whatsapp.labelViewApply"], params.jobUrl)
    ).trim();
  },

  /** Client -> Professional, contacting from a public profile. */
  professionalContact(
    params: { professionalName: string; profileUrl: string },
    locale: Locale = DEFAULT_LOCALE
  ): string {
    const t = getDictionary(locale);
    return (
      `Hello ${params.professionalName},\n\n` +
      `${t["whatsapp.professionalContactIntro"]}\n\n` +
      line(t["whatsapp.labelDhiilProfile"], params.profileUrl) +
      t["whatsapp.thankYou"]
    ).trim();
  },

  /** Professional -> Client, contacting about a specific job/application. */
  clientContact(
    params: {
      clientName: string;
      jobTitle: string;
      profileUrl: string;
      applicationUrl?: string | null;
    },
    locale: Locale = DEFAULT_LOCALE
  ): string {
    const t = getDictionary(locale);
    return (
      `Hello ${params.clientName},\n\n` +
      `${t["whatsapp.clientContactFoundJob"]}\n${params.jobTitle}\n\n` +
      `${t["whatsapp.clientContactInterested"]}\n\n` +
      line(t["whatsapp.labelMyProfile"], params.profileUrl) +
      (params.applicationUrl ? line(t["whatsapp.labelApplication"], params.applicationUrl) : "") +
      t["whatsapp.thankYou"]
    ).trim();
  },

  /** Optional follow-up: client accepted the professional's application. */
  applicationAccepted(
    params: { professionalName: string; jobTitle: string },
    locale: Locale = DEFAULT_LOCALE
  ): string {
    const t = getDictionary(locale);
    return t["whatsapp.applicationAcceptedFollowUp"]
      .replace("{name}", params.professionalName)
      .replace("{job}", params.jobTitle);
  },

  /** Optional follow-up: client shortlisted the professional's application. */
  applicationShortlisted(
    params: { professionalName: string; jobTitle: string },
    locale: Locale = DEFAULT_LOCALE
  ): string {
    const t = getDictionary(locale);
    return t["whatsapp.applicationShortlistedFollowUp"]
      .replace("{name}", params.professionalName)
      .replace("{job}", params.jobTitle);
  },
};
