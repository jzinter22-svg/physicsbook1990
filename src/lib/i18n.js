/*
  Plain JS modules (not .json) on purpose: a bare `import x from './y.json'`
  requires an import-attribute (`with { type: 'json' }`) to load as a native
  ES module in a browser with no bundler — Vite's dev/build pipeline papers
  over that, but this project is also served as raw static files (GitHub
  Pages, no build step), where the unassisted JSON import fails outright
  ("Failed to load module script... MIME type of application/json") and
  aborts the whole module graph, silently blanking every page that imports
  i18n.js. A `.js` file exporting the same object sidesteps the whole
  import-attribute question — it's just a normal module.
*/
import ar from '../locales/ar.js';
import en from '../locales/en.js';

const STORAGE_KEY = 'physicsbook:lang';

const DICTIONARIES = { ar, en };
const DIRECTIONS = { ar: 'rtl', en: 'ltr' };

/** Arabic is the primary language of this project. */
export const DEFAULT_LANG = 'ar';

/** @returns {'ar' | 'en'} */
export function getStoredLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : DEFAULT_LANG;
}

export function dirFor(lang) {
  return DIRECTIONS[lang] ?? 'ltr';
}

export function t(key, lang = getStoredLang()) {
  return DICTIONARIES[lang]?.[key] ?? DICTIONARIES[DEFAULT_LANG]?.[key] ?? key;
}

/** Applies lang/dir to <html> and re-renders every [data-i18n] node in the document. */
export function applyLang(lang) {
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', dirFor(lang));

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    node.textContent = t(key, lang);
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
    // format: data-i18n-attr="aria-label:action.toggleTheme"
    node.getAttribute('data-i18n-attr').split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) node.setAttribute(attr, t(key, lang));
    });
  });

  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function setLang(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  applyLang(lang);
}

export function toggleLang() {
  setLang(getStoredLang() === 'ar' ? 'en' : 'ar');
}

/** Call once on startup. */
export function initI18n() {
  applyLang(getStoredLang());
}
