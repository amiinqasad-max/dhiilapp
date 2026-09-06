// Country picker data — ISO 3166-1 alpha-2 codes from libphonenumber-js
// (the same list validation.ts/whatsapp.ts already treat as canonical),
// paired with a display name resolved via the platform's own Intl API so
// we don't have to ship/maintain a name list ourselves.

import { getCountries, getCountryCallingCode } from "libphonenumber-js";

export interface CountryOption {
  code: string; // ISO 3166-1 alpha-2, e.g. "SO"
  name: string; // localized display name, e.g. "Somalia" / "Soomaaliya"
  dialCode: string; // e.g. "252" (no leading "+")
}

/**
 * Build the full country list, with names localized to the given BCP-47
 * locale when the runtime supports it (falls back to English, then to the
 * bare code if Intl.DisplayNames is unavailable at all).
 */
export function getCountryOptions(locale: string = "en"): CountryOption[] {
  let displayNames: Intl.DisplayNames | null = null;
  try {
    displayNames = new Intl.DisplayNames([locale, "en"], { type: "region" });
  } catch {
    displayNames = null;
  }

  const options = getCountries().map((code) => {
    let name: string = code;
    try {
      name = displayNames?.of(code) || code;
    } catch {
      name = code;
    }
    let dialCode = "";
    try {
      dialCode = getCountryCallingCode(code);
    } catch {
      dialCode = "";
    }
    return { code, name, dialCode };
  });

  return options.sort((a, b) => a.name.localeCompare(b.name));
}
