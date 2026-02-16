/**
 * Offline storage utility using IndexedDB
 * Queues form submissions (pre-starts, services) for sync when back online
 */

const DB_NAME = 'orchard-offline';
const DB_VERSION = 1;
const STORES = ['prestart', 'services'];

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save data to offline queue
 * @param {'prestart' | 'services'} storeName
 * @param {object} data - The form data to queue
 */
export async function saveOffline(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.add({ data, timestamp: new Date().toISOString() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all pending items from a store
 * @param {'prestart' | 'services'} storeName
 */
export async function getPending(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Remove a synced item from offline store
 * @param {'prestart' | 'services'} storeName
 * @param {number} id
 */
export async function removeSynced(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get count of pending items
 * @param {'prestart' | 'services'} storeName
 */
export async function getPendingCount(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Try to submit data; if offline, queue it for later sync
 * @param {string} url - API endpoint
 * @param {object} data - Form data
 * @param {'prestart' | 'services'} storeName - Queue store name
 * @returns {{ ok: boolean, offline: boolean, data?: object }}
 */
export async function submitWithOfflineFallback(url, data, storeName) {
  if (!navigator.onLine) {
    const id = await saveOffline(storeName, data);
    return { ok: true, offline: true, queueId: id };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const result = await res.json();
    return { ok: true, offline: false, data: result };
  } catch (err) {
    // Network error — queue offline
    const id = await saveOffline(storeName, data);
    return { ok: true, offline: true, queueId: id };
  }
}
