const CACHE_PREFIX = "voiceguard-static-";
const CACHE_NAME = `${CACHE_PREFIX}v4`;

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.json",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/apple-touch-icon.png",
  "/assets/audio/young_polite/hai.wav",
  "/assets/audio/young_polite/haai.wav",
  "/assets/audio/young_polite/arigatou.wav",
  "/assets/audio/young_polite/okidoki.wav",
  "/assets/audio/young_polite/shoushou.wav",
  "/assets/audio/young_blunt/hai.wav",
  "/assets/audio/young_blunt/haai.wav",
  "/assets/audio/young_blunt/arigatou.wav",
  "/assets/audio/young_blunt/okidoki.wav",
  "/assets/audio/young_blunt/shoushou.wav"
];

const CORE_ASSET_PATHS = new Set(CORE_ASSETS);
const PUBLIC_ASSET_EXTENSION = /\.(?:css|js|json|png|jpe?g|svg|webp|wav|mp3|woff2?)$/i;

function isPublicNavigationPath(pathname) {
  return pathname === "/" || /^\/[a-z0-9-]+\.html$/i.test(pathname);
}

function isPublicAssetPath(pathname) {
  if (CORE_ASSET_PATHS.has(pathname)) {
    return true;
  }

  return pathname.startsWith("/assets/") && PUBLIC_ASSET_EXTENSION.test(pathname);
}

async function fetchAndCache(request, cacheKey) {
  const response = await fetch(request);
  if (response && response.status === 200 && response.type === "basic") {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(cacheKey, response.clone());
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    if (!isPublicNavigationPath(requestUrl.pathname)) {
      return;
    }

    const cacheKey = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;

    event.respondWith(
      fetchAndCache(event.request, cacheKey)
        .catch(() =>
          caches.match(cacheKey).then((cachedResponse) => cachedResponse || caches.match("/index.html"))
        )
    );
    return;
  }

  if (!isPublicAssetPath(requestUrl.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(requestUrl.pathname).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetchAndCache(event.request, requestUrl.pathname);
    })
  );
});
