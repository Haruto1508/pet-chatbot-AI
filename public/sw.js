const CACHE_NAME = 'vethic-offline-v1';
const OFFLINE_URL = '/maintenance.html';
const ASSETS_TO_CACHE = [
  '/maintenance.html',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Pre-caching maintenance assets warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept HTML navigation requests (page visits / reload when web crashes or goes offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // Network failed or server is down: Serve high-end Maintenance & Upgrade Page
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(OFFLINE_URL);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('Hệ thống đang bảo trì. Vui lòng quay lại sau.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
    return;
  }

  // Fallback for logo if requested when offline
  if (event.request.url.includes('/logo.png')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).catch(() => caches.match('/logo.png'));
      })
    );
  }
});
