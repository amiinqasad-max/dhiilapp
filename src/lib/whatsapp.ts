// DHIIL WhatsApp Service — the single, centralized place for
// phone-number normalization, message encoding, and WhatsApp
// click-to-chat URL generation. Every WhatsApp CTA in the app must go
// through this module — never build a wa.me URL by hand elsewhere.
//
// IMPORTANT: opening this link only opens a compose window in
// WhatsApp. It is never proof of delivery or reading — callers must use
// wording like "Continue on WhatsApp" / "WhatsApp opened", never
// "Message sent" or "Message delivered".

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

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
  application(params: {
    jobTitle: string;
    category: string;
    professionalName: string;
    skills: string[];
    proposedPrice: number;
    deliveryTime: string;
    coverLetter: string;
    portfolioUrl?: string | null;
    applicationUrl: string;
  }): string {
    return (
      `Hello, I found your job on DHIIL and I would like to apply.\n\n` +
      `JOB APPLICATION — DHIIL\n\n` +
      line("Job", params.jobTitle) +
      line("Category", params.category) +
      line("Professional", params.professionalName) +
      line("Skills", params.skills.join(", ")) +
      line("Proposed Price", params.proposedPrice) +
      line("Delivery Time", params.deliveryTime) +
      line("Cover Letter", params.coverLetter) +
      (params.portfolioUrl ? line("Portfolio", params.portfolioUrl) : "") +
      line("DHIIL Application", params.applicationUrl) +
      `Thank you.`
    ).trim();
  },

  /** Client sharing a newly published job to their own WhatsApp contacts. */
  jobShare(params: {
    jobTitle: string;
    category: string;
    budget: string;
    location?: string | null;
    shortDescription: string;
    skills: string[];
    jobUrl: string;
  }): string {
    return (
      `DHIIL — NEW JOB\n\n` +
      line("Job", params.jobTitle) +
      line("Category", params.category) +
      line("Budget", params.budget) +
      (params.location ? line("Location", params.location) : "") +
      line("Description", params.shortDescription) +
      line("Skills", params.skills.join(", ")) +
      line("View & Apply", params.jobUrl)
    ).trim();
  },

  /** Client -> Professional, contacting from a public profile. */
  professionalContact(params: { professionalName: string; profileUrl: string }): string {
    return (
      `Hello ${params.professionalName},\n\n` +
      `I found your profile on DHIIL and I am interested in your services. ` +
      `I would like to discuss a potential project with you.\n\n` +
      line("DHIIL Profile", params.profileUrl) +
      `Thank you.`
    ).trim();
  },

  /** Professional -> Client, contacting about a specific job/application. */
  clientContact(params: {
    clientName: string;
    jobTitle: string;
    profileUrl: string;
    applicationUrl?: string | null;
  }): string {
    return (
      `Hello ${params.clientName},\n\n` +
      `I found your job on DHIIL:\n${params.jobTitle}\n\n` +
      `I am interested in discussing the project with you.\n\n` +
      line("My DHIIL Profile", params.profileUrl) +
      (params.applicationUrl ? line("Application", params.applicationUrl) : "") +
      `Thank you.`
    ).trim();
  },

  /** Optional follow-up: client accepted the professional's application. */
  applicationAccepted(params: { professionalName: string; jobTitle: string }): string {
    return (
      `Hi ${params.professionalName}, great news — your application for ` +
      `"${params.jobTitle}" has been accepted on DHIIL. Let's discuss next steps.`
    );
  },

  /** Optional follow-up: client shortlisted the professional's application. */
  applicationShortlisted(params: { professionalName: string; jobTitle: string }): string {
    return (
      `Hi ${params.professionalName}, your application for "${params.jobTitle}" ` +
      `has been shortlisted on DHIIL.`
    );
  },
};
