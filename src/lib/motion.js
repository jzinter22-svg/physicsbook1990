const STORAGE_KEY = 'physicsbook:motion';

function systemPrefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** @returns {'reduced' | 'full'} */
export function getStoredMotion() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'reduced' || stored === 'full') return stored;
  return systemPrefersReduced() ? 'reduced' : 'full';
}

/** @param {'reduced' | 'full'} motion */
export function applyMotion(motion) {
  document.documentElement.setAttribute('data-motion', motion);
  document.dispatchEvent(new CustomEvent('motionchange', { detail: { motion } }));
}

/** @param {'reduced' | 'full'} motion */
export function setMotion(motion) {
  localStorage.setItem(STORAGE_KEY, motion);
  applyMotion(motion);
}

export function prefersReducedMotion() {
  return document.documentElement.getAttribute('data-motion') === 'reduced';
}

/** Call once on startup. */
export function initMotion() {
  applyMotion(getStoredMotion());

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
    if (localStorage.getItem(STORAGE_KEY)) return; // explicit user choice wins
    applyMotion(event.matches ? 'reduced' : 'full');
  });
}
