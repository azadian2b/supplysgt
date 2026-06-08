import { getCached, setCached } from './offlineStore';

const CONNECTIVITY_KEY = 'connectivity-mode';
const listeners = new Set();
let currentMode = 'online';
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;
  currentMode = await getCached(CONNECTIVITY_KEY, 'online');
  loaded = true;
}

function emit(mode) {
  listeners.forEach(listener => listener(mode));
  window.dispatchEvent(new CustomEvent('supplysgt:connectivity-mode', { detail: { mode } }));
}

export async function getConnectivityMode() {
  await ensureLoaded();
  return currentMode;
}

export function getConnectivityModeSnapshot() {
  return currentMode;
}

export async function setConnectivityMode(mode) {
  const normalized = mode === 'offline' ? 'offline' : 'online';
  await ensureLoaded();
  if (currentMode === normalized) return normalized;
  currentMode = normalized;
  await setCached(CONNECTIVITY_KEY, normalized);
  emit(normalized);
  return normalized;
}

export function subscribeConnectivityMode(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
