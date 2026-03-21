const CACHE_NAME = "privadeck-v1";
const FFMPEG_CACHE = "privadeck-ffmpeg-v1";
const STATIC_CACHE = "privadeck-static-v1";

// FFmpeg wasm files — cache permanently (URL contains version)
const FFMPEG_URLS = [
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== FFMPEG_CACHE && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // FFmpeg wasm — cache-first, permanent
  if (FFMPEG_URLS.some((u) => event.request.url.startsWith(u))) {
    event.respondWith(
      caches.open(FFMPEG_CACHE).then((cache) =>
        cache.match(event.request).then(
          (cached) =>
            cached ||
            fetch(event.request).then((response) => {
              if (response.ok) cache.put(event.request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Skip non-GET and cross-origin (except FFmpeg above)
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // HTML — network-first (keep Cloudflare Pages content fresh)
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r ?? Response.error()))
    );
    return;
  }

  // Static assets (JS, CSS, images) — cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|ico)$/) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then(
          (cached) =>
            cached ||
            fetch(event.request)
              .then((response) => {
                if (response.ok) cache.put(event.request, response.clone());
                return response;
              })
              .catch(() => caches.match(event.request).then((r) => r ?? Response.error()))
        )
      )
    );
    return;
  }
});
