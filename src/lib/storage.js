/**
 * Safe localStorage wrapper. College machines sometimes block storage
 * (private browsing, locked-down profiles), so every call is wrapped in
 * try/catch and falls back to an in-memory object. The app keeps working
 * for the session; it just won't survive a refresh.
 */

const memoryFallback = new Map();

/**
 * @param {string} key
 * @returns {unknown|null} parsed value, or null if absent or unreadable
 */
export function loadState(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return memoryFallback.has(key) ? memoryFallback.get(key) : null;
    return JSON.parse(raw);
  } catch {
    return memoryFallback.has(key) ? memoryFallback.get(key) : null;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 */
export function saveState(key, value) {
  memoryFallback.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full. The in-memory copy keeps the app working.
  }
}

/**
 * @param {string} key
 */
export function clearState(key) {
  memoryFallback.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do if storage is blocked.
  }
}
