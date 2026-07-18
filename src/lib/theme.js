const STORAGE_KEY = 'physicsbook:theme';

/** @typedef {'light' | 'dark'} Theme */

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** @returns {Theme} */
export function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return systemPrefersDark() ? 'dark' : 'light';
}

/** @param {Theme} theme */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

/** @param {Theme} theme */
export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

/** Call once on startup, before first paint if possible. */
export function initTheme() {
  applyTheme(getStoredTheme());

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (localStorage.getItem(STORAGE_KEY)) return; // explicit user choice wins
    applyTheme(event.matches ? 'dark' : 'light');
  });
}
