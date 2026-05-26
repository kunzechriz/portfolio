const CACHE_NAME = 'smarthome-cache-v1';
const urlsToCache = [
  '/',
  '/static/style.css',
  '/static/script.js',
  '/static/manifest.json',
  '/static/icon-192.png',
  '/static/icon-512.png'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
            console.warn("Failed to cache some resources during install:", err);
        });
      })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', event => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;
  // Ignore API calls or external domains if needed, for now we do Network First
  
  event.respondWith(
    fetch(event.request).then(response => {
      // Return fresh network response, and potentially update cache
      return response;
    }).catch(() => {
      // If network fails, try to return from cache
      return caches.match(event.request).then(response => {
        if (response) {
            return response;
        }
      });
    })
  );
});
