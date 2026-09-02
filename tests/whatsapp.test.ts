import { describe, it, expect } from "vitest";
import {
  normalizePhoneNumber,
  generateWhatsAppLink,
  generateWhatsAppShareLink,
  WhatsAppTemplates,
} from "@/lib/whatsapp";

describe("normalizePhoneNumber", () => {
  it("normalizes a valid US number to E.164", () => {
    const result = normalizePhoneNumber("2025550123", "US");
    expect(result).not.toBeNull();
    expect(result!.e164).toBe("+12025550123");
    expect(result!.digitsOnly).toBe("12025550123");
  });

  it("returns null for an invalid number", () => {
    expect(normalizePhoneNumber("123", "US")).toBeNull();
  });

  it("returns null for missing input", () => {
    expect(normalizePhoneNumber(null, "US")).toBeNull();
    expect(normalizePhoneNumber(undefined, "US")).toBeNull();
  });

  it("accepts a number already in E.164 form without a country hint", () => {
    const result = normalizePhoneNumber("+12025550123", undefined);
    expect(result?.e164).toBe("+12025550123");
  });
});

describe("generateWhatsAppLink", () => {
  it("builds a correct wa.me URL with the destination number and encoded message", () => {
    const link = generateWhatsAppLink("2025550123", "US", "Hello, world! & special <chars>");
    expect(link).not.toBeNull();
    expect(link).toMatch(/^https:\/\/wa\.me\/12025550123\?text=/);
    // No raw unescaped special characters in the URL.
    expect(link).not.toContain(" ");
    expect(link).not.toContain("<");
    expect(link).not.toContain(">");
    expect(link).not.toContain("&special"); // '&' must be encoded, not a literal query separator
    const decoded = decodeURIComponent(link!.split("?text=")[1]);
    expect(decoded).toBe("Hello, world! & special <chars>");
  });

  it("returns null when the phone number cannot be normalized", () => {
    expect(generateWhatsAppLink("not-a-number", "US", "hi")).toBeNull();
    expect(generateWhatsAppLink(null, "US", "hi")).toBeNull();
  });
});

describe("generateWhatsAppShareLink", () => {
  it("builds a no-recipient share URL", () => {
    const link = generateWhatsAppShareLink("Check this out");
    expect(link).toBe("https://wa.me/?text=Check%20this%20out");
  });
});

describe("WhatsAppTemplates", () => {
  it("application() includes job, professional, price, delivery, cover letter, and application URL", () => {
    const msg = WhatsAppTemplates.application({
      jobTitle: "Design a logo",
      category: "Design",
      professionalName: "Amina",
      skills: ["Illustrator", "Branding"],
      proposedPrice: 150,
      deliveryTime: "3 days",
      coverLetter: "I would love to help.",
      applicationUrl: "https://dhiil.app/jobs/123",
    });
    expect(msg).toContain("Design a logo");
    expect(msg).toContain("Amina");
    expect(msg).toContain("Illustrator, Branding");
    expect(msg).toContain("150");
    expect(msg).toContain("3 days");
    expect(msg).toContain("I would love to help.");
    expect(msg).toContain("https://dhiil.app/jobs/123");
    expect(msg).not.toContain("Message Sent");
  });

  it("application() renders localized scaffolding (Somali by default, English on request)", () => {
    const params = {
      jobTitle: "Design a logo",
      category: "Design",
      professionalName: "Amina",
      skills: ["Illustrator"],
      proposedPrice: 150,
      deliveryTime: "3 days",
      coverLetter: "I would love to help.",
      applicationUrl: "https://dhiil.app/jobs/123",
    };
    const so = WhatsAppTemplates.application(params); // default locale = Somali
    const en = WhatsAppTemplates.application(params, "en");
    expect(so).toContain("CODSI SHAQO");
    expect(en).toContain("JOB APPLICATION");
    expect(so).not.toBe(en);
    // Both still carry the untranslated user-generated content verbatim.
    for (const msg of [so, en]) {
      expect(msg).toContain("Design a logo");
      expect(msg).toContain("I would love to help.");
    }
  });

  it("jobShare() includes budget, category, location, and job URL", () => {
    const msg = WhatsAppTemplates.jobShare({
      jobTitle: "Build a website",
      category: "Development",
      budget: "$500",
      location: "Remote",
      shortDescription: "Need a small business site.",
      skills: ["React"],
      jobUrl: "https://dhiil.app/jobs/456",
    });
    expect(msg).toContain("Build a website");
    expect(msg).toContain("$500");
    expect(msg).toContain("Remote");
    expect(msg).toContain("https://dhiil.app/jobs/456");
  });

  it("professionalContact() and clientContact() never claim delivery", () => {
    const a = WhatsAppTemplates.professionalContact({ professionalName: "Amina", profileUrl: "https://dhiil.app/p/1" });
    const b = WhatsAppTemplates.clientContact({ clientName: "Omar", jobTitle: "Logo", profileUrl: "https://dhiil.app/p/1" });
    for (const msg of [a, b]) {
      expect(msg.toLowerCase()).not.toContain("message sent");
      expect(msg.toLowerCase()).not.toContain("delivered");
    }
  });
});
