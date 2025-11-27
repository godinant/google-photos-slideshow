const CACHE_NAME = 'google-photos-slideshow-v2-clean';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip Google APIs and Photos URLs - always fetch fresh
  if (event.request.url.includes('googleapis.com') || 
      event.request.url.includes('googleusercontent.com') ||
      event.request.url.includes('accounts.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response
        const responseClone = response.clone();
        
        // Cache the fetched response
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });
        
        return response;
      })
      .catch(() => {
        // If fetch fails, try cache
        return caches.match(event.request)
          .then(response => {
            return response || new Response('Offline - Sem conexão à internet');
          });
      })
  );
});
