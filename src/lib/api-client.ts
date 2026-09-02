// Thin fetch wrapper used by client components. Centralizing this keeps
// error handling consistent and makes it the one place a future native
// client's API layer would mirror.

export class ApiClientError extends Error {
  status: number;
  /** Stable machine-readable error code (see the errors.json locale files
   * under src/lib/i18n/locales). Used to render a localized message
   * instead of the server's English fallback text — see `translateApiError`
   * below. */
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  let body: { error?: string; code?: string } | null = null;
  try {
    body = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiClientError(res.status, body?.error || "Something went wrong.", body?.code);
  }

  return body as T;
}

/**
 * Turn any caught error into a localized, user-facing string. Always
 * prefers the translated `errors.<code>` entry over the server's raw
 * English message, so the UI never shows English text while Somali is
 * selected — even for error paths we haven't explicitly localized yet.
 */
export function translateApiError(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiClientError) {
    if (err.code) {
      const translated = t(`errors.${err.code}`);
      if (translated !== `errors.${err.code}`) return translated;
    }
  }
  return t("errors.GENERIC_ERROR");
}
