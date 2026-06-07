const CACHE_VERSION = 'bhojanseva-v2';
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/hero_rangoli_pattern.png',
  '/langar_hall.png',
  '/community_feeding_illustration.png',
];

// Install: cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for images, network-first for API, stale-while-revalidate for tiles
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and supabase API calls (always fresh)
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;

  // Map tiles — cache aggressively
  if (url.hostname.includes('cartocdn.com') || url.hostname.includes('openstreetmap.org')) {
    event.respondWith(
      caches.open('map-tiles-v1').then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      })
    );
    return;
  }

  // App shell — stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(event.request);
      const fetchPromise = fetch(event.request).then((res) => {
        if (res.ok) cache.put(event.request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || '🍛 BhojanSeva', {
      body: data.body || 'A new Seva camp is live near you!',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: data.url || '/', sevaId: data.sevaId },
      actions: [
        { action: 'navigate', title: '📍 View on Map' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      vibrate: [100, 50, 100],
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'navigate' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});
