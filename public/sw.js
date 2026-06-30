const CACHE_NAME = 'taipei-friendly-food-map-v3';
const BASE_PATH = new URL(self.registration.scope).pathname;
const withBase = (path) => `${BASE_PATH}${path}`;
const APP_SHELL = [
  BASE_PATH,
  withBase('manifest.webmanifest'),
  withBase('data/friendly-stores.json'),
  withBase('data/water-refill-stores.json'),
  withBase('data/restaurant-businesses.json'),
  withBase('data/friendly-food-summary.json'),
  withBase('data/food-traceability/summary.json'),
  withBase('data/food-traceability/companies.json'),
  withBase('data/food-traceability/brands.json'),
  withBase('data/food-traceability/products-index.json'),
  withBase('data/food-traceability/ingredients-index.json'),
  withBase('data/food-traceability/search-index.json'),
  withBase('data/food-traceability/chunk-manifest.json'),
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith(withBase('data/'))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && requestUrl.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }),
  );
});
