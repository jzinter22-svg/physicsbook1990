import ar from '../locales/ar.json';
import en from '../locales/en.json';

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
