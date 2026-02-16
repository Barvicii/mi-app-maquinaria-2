const CACHE_NAME = 'orchard-services-v1';

// Assets to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/Imagen/logoo.png',
  '/favicon.png',
  '/offline',
];

// Install: precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Some precache URLs failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip NextAuth and API requests (except public API)
  if (url.pathname.startsWith('/api/auth')) return;

  // API requests: network-first with fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET API responses for offline fallback
          if (response.ok && url.pathname.startsWith('/api/public/')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({ error: 'Offline', offline: true }),
              { headers: { 'Content-Type': 'application/json' }, status: 503 }
            );
          });
        })
    );
    return;
  }

  // Static assets and pages: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // If network fails and no cache, return offline page for navigation
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return cached || new Response('Offline', { status: 503 });
        });

      return cached || networkFetch;
    })
  );
});

// Handle background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-prestart') {
    event.waitUntil(syncOfflineData('prestart'));
  }
  if (event.tag === 'sync-services') {
    event.waitUntil(syncOfflineData('services'));
  }
});

async function syncOfflineData(storeName) {
  try {
    // Open IndexedDB
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const items = await getAllFromStore(store);

    for (const item of items) {
      try {
        const endpoint = storeName === 'prestart' ? '/api/prestart' : '/api/services';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });

        if (res.ok) {
          // Remove from IndexedDB after successful sync
          const deleteTx = db.transaction(storeName, 'readwrite');
          deleteTx.objectStore(storeName).delete(item.id);
        }
      } catch (err) {
        console.warn(`[SW] Failed to sync ${storeName} item:`, err);
      }
    }
  } catch (err) {
    console.warn('[SW] Sync failed:', err);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('orchard-offline', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('prestart')) {
        db.createObjectStore('prestart', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('services')) {
        db.createObjectStore('services', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
