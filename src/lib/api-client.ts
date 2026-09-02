// Thin fetch wrapper used by client components. Centralizing this keeps
// error handling consistent and makes it the one place a future native
// client's API layer would mirror.

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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

  let body: { error?: string } | null = null;
  try {
    body = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiClientError(res.status, body?.error || "Something went wrong.");
  }

  return body as T;
}
