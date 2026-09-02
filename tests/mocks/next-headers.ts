// Minimal in-memory stand-in for next/headers' cookies() so route handlers
// can be exercised directly in tests without a full Next.js server.
interface StoredCookie {
  value: string;
}

export const cookieStore = new Map<string, StoredCookie>();

export function cookies() {
  return {
    get(name: string) {
      return cookieStore.get(name);
    },
    set(name: string, value: string) {
      if (value === "") {
        cookieStore.delete(name);
      } else {
        cookieStore.set(name, { value });
      }
    },
  };
}
