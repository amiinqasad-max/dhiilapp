// DHIIL Service Worker — minimal, honest offline behavior:
// - Precache the app shell + offline fallback page.
// - Cache-first for static, hashed Next.js build assets (safe to cache
//   aggressively — the filename changes when the content does).
// - Network-first for navigations (pages), falling back to a cached copy
//   of that page or, failing that, the offline fallback page.
// - Never intercept non-GET requests (job posting, applying, status
//   changes, etc.) — those always go straight to the network, so we never
//   pretend a mutation succeeded while offline.

const CACHE_VERSION = "dhiil-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const SHELL_URLS = ["/", "/offline.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("dhiil-") && key !== SHELL_CACHE && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never intercept mutations or API calls that read live/private data —
  // those must always hit the network so DHIIL stays the honest source of
  // truth for marketplace state.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  // Hashed Next.js build assets: cache-first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Page navigations: network-first, falling back to cache, then to the
  // offline fallback page. We never fabricate a successful response.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone synchronously, before the body can be consumed elsewhere —
          // caches.open() is async, so cloning inside its .then() risks
          // racing the browser's own read of the (single-use) response body.
          const responseCopy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, responseCopy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/offline.html");
        })
    );
    return;
  }

  // Everything else (icons, manifest, fonts): cache-first with network fallback.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => cached))
  );
});
