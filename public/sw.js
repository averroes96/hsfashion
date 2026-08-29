// Service Worker for H.S.Fashion Offline Showroom PWA
const CORE_CACHE = 'hsfashion-core-v2';
const IMAGE_CACHE = 'hsfashion-images-v2';
const DATA_CACHE = 'hsfashion-data-v2';

const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/splash-logo.png',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('PWA: Failed to cache some core assets during install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![CORE_CACHE, IMAGE_CACHE, DATA_CACHE].includes(key)) {
            console.log('PWA: Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Determine if URL is an image
function isImageUrl(url) {
  return (
    url.includes('cloudinary.com') ||
    url.includes('/uploads/') ||
    url.match(/\.(png|jpg|jpeg|webp|svg|gif)(\?.*)?$/i)
  );
}

// Helper: Determine if URL is an API or data request
function isDataUrl(url) {
  return (
    url.includes('/api/products') ||
    url.includes('/api/catalogs') ||
    url.includes('/api/families')
  );
}

// Fetch Event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;

  // Ignore non-GET requests (e.g. POST, PUT, DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // 1. Image Strategy: Cache-First with Network Fallback & Auto-Cache
  if (isImageUrl(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // If offline and not in cache, return fallback if available
          return cachedResponse || new Response('Image unavailable offline', { status: 503 });
        }
      })
    );
    return;
  }

  // 2. Data / API Strategy: Network-First with Cache Fallback
  if (isDataUrl(url)) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(JSON.stringify({ error: 'Offline mode', offline: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })
    );
    return;
  }

  // 3. HTML Pages & Next.js Static Chunks: Stale-While-Revalidate
  event.respondWith(
    caches.open(CORE_CACHE).then(async (cache) => {
      const cachedResponse = await cache.match(request);

      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && request.url.startsWith('http')) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
