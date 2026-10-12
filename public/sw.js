// BatchCheck PWA Service Worker
const CACHE_NAME = "batchcheck-v1";
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precache only core shell assets, explicitly avoiding heavy 3D chunks
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip caching API routes - they must always be fresh
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Network-first strategy for navigation, cache-first for static icons/assets
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((res) => res || caches.match("/"));
      })
    );
    return;
  }

  // For other requests: runtime cache with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache runtime static assets, but do not aggressively cache 3D chunks
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.endsWith(".svg") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".css"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

