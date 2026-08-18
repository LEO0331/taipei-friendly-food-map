const CACHE_NAME = 'taipei-friendly-food-map-v10';
const BASE_PATH = new URL(self.registration.scope).pathname;
const withBase = (path) => `${BASE_PATH}${path}`;
const APP_SHELL = [
  withBase('index.html'),
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
  withBase('data/commercial-district-introductions.json'),
  withBase('data/commercial-district-introduction-summary.json'),
  withBase('data/green-store-directory/records.json'),
  withBase('data/green-store-directory/summary.json'),
  withBase('data/restaurant-hygiene-grading-records/records.json'),
  withBase('data/restaurant-hygiene-grading-records/summary.json'),
  withBase('data/failed-food-inspection-records/records.json'),
  withBase('data/failed-food-inspection-records/summary.json'),
  withBase('data/organic-farms/records.json'),
  withBase('data/organic-farms/summary.json'),
  withBase('data/temporary-vendor-markets/records.json'),
  withBase('data/temporary-vendor-markets/summary.json'),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached ?? caches.match(withBase('index.html'));
        }),
    );
    return;
  }
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
