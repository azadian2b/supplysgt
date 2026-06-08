import localForage from 'localforage';

export const OFFLINE_SCHEMA_VERSION = 1;

export const offlineStore = localForage.createInstance({
  name: 'supply-sgt',
  storeName: 'offline-custody-v1'
});

export function cacheKey(...parts) {
  return parts.filter(part => part !== undefined && part !== null && part !== '').join(':');
}

export async function getCached(key, fallback = null) {
  const value = await offlineStore.getItem(key);
  return value === null || value === undefined ? fallback : value;
}

export async function setCached(key, value) {
  await offlineStore.setItem(key, value);
  return value;
}

export async function removeCached(key) {
  await offlineStore.removeItem(key);
}

export async function clearOfflineStore() {
  await offlineStore.clear();
}
