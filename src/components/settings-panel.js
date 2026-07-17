import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';
import { getStoredTheme, setTheme } from '../lib/theme.js';
import { getStoredLang, setLang } from '../lib/i18n.js';
import { getStoredMotion, setMotion } from '../lib/motion.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: none;
  }
  :host([open]) {
    display: block;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(6, 11, 18, 0.5);
  }
  .panel {
    position: fixed;
    inset-block: 0;
    inset-inline-end: 0;
    width: min(340px, 90vw);
    background: var(--glass-bg-strong);
    border-inline-start: 1px solid var(--glass-border);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    display: flex;
    flex-direction: column;
    transform: translateX(0);
    animation: slide-in var(--duration-normal) var(--ease-standard);
  }
  @keyframes slide-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5);
    border-block-end: 1px solid var(--color-border);
  }
  .head h2 {
    margin: 0;
    font-size: var(--fs-500);
  }
  .close-btn {
    appearance: none;
    border: 1px solid var(--color-border);
    background: var(--color-bg-raised);
    border-radius: var(--radius-pill);
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    cursor: pointer;
    color: var(--color-text);
  }
  .body {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    overflow-y: auto;
  }
  .field label.field-label {
    display: block;
    font-weight: 700;
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    margin-block-end: var(--space-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .segmented {
    display: flex;
    background: var(--color-bg-sunken);
    border-radius: var(--radius-md);
    padding: 4px;
    gap: 4px;
  }
  .segmented button {
    flex: 1;
    appearance: none;
    border: none;
    background: none;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    font: inherit;
    font-weight: 600;
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }
  .segmented button[aria-pressed='true'] {
    background: var(--color-bg-raised);
    color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }
  .segmented svg {
    width: 1em;
    height: 1em;
  }
`;

const THEME_OPTIONS = [
  { value: 'light', icon: 'sun', key: 'settings.theme.light' },
  { value: 'dark', icon: 'moon', key: 'settings.theme.dark' },
];
const LANG_OPTIONS = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];
const MOTION_OPTIONS = [
  { value: 'full', key: 'settings.motion.full' },
  { value: 'reduced', key: 'settings.motion.reduced' },
];

class SettingsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="backdrop"></div>
      <div class="panel" role="dialog" aria-modal="true">
        <div class="head">
          <h2 data-i18n="settings.title"></h2>
          <button class="close-btn" id="close-btn" type="button">${icon('close')}</button>
        </div>
        <div class="body">
          <div class="field">
            <label class="field-label" data-i18n="settings.theme.label"></label>
            <div class="segmented" id="theme-group"></div>
          </div>
          <div class="field">
            <label class="field-label" data-i18n="settings.language.label"></label>
            <div class="segmented" id="lang-group"></div>
          </div>
          <div class="field">
            <label class="field-label" data-i18n="settings.motion.label"></label>
            <div class="segmented" id="motion-group"></div>
          </div>
        </div>
      </div>
    `;

    this._themeGroup = this.shadowRoot.getElementById('theme-group');
    this._langGroup = this.shadowRoot.getElementById('lang-group');
    this._motionGroup = this.shadowRoot.getElementById('motion-group');

    this.shadowRoot.getElementById('close-btn').addEventListener('click', () => this.close());
    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this.close());

    this._onOpenRequest = () => this.open();
    this._onKeydown = (event) => {
      if (event.key === 'Escape' && this.hasAttribute('open')) this.close();
    };
    document.addEventListener('open-settings', this._onOpenRequest);
    document.addEventListener('keydown', this._onKeydown);

    this._render();
    this._onLangChange = () => this._render();
    this._onThemeChange = () => this._render();
    this._onMotionChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
    document.addEventListener('themechange', this._onThemeChange);
    document.addEventListener('motionchange', this._onMotionChange);
  }

  disconnectedCallback() {
    document.removeEventListener('open-settings', this._onOpenRequest);
    document.removeEventListener('keydown', this._onKeydown);
    document.removeEventListener('langchange', this._onLangChange);
    document.removeEventListener('themechange', this._onThemeChange);
    document.removeEventListener('motionchange', this._onMotionChange);
  }

  open() {
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }

  _render() {
    this.shadowRoot.querySelector('[data-i18n="settings.title"]').textContent = t('settings.title');
    this.shadowRoot.querySelector('[data-i18n="settings.theme.label"]').textContent = t('settings.theme.label');
    this.shadowRoot.querySelector('[data-i18n="settings.language.label"]').textContent = t('settings.language.label');
    this.shadowRoot.querySelector('[data-i18n="settings.motion.label"]').textContent = t('settings.motion.label');
    this.shadowRoot.getElementById('close-btn').setAttribute('aria-label', t('settings.close'));

    const theme = getStoredTheme();
    this._themeGroup.innerHTML = THEME_OPTIONS.map(
      (opt) => `<button type="button" data-value="${opt.value}" aria-pressed="${opt.value === theme}">${icon(opt.icon)}${t(opt.key)}</button>`
    ).join('');
    this._themeGroup.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.value));
    });

    const lang = getStoredLang();
    this._langGroup.innerHTML = LANG_OPTIONS.map(
      (opt) => `<button type="button" data-value="${opt.value}" aria-pressed="${opt.value === lang}">${opt.label}</button>`
    ).join('');
    this._langGroup.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.dataset.value));
    });

    const motion = getStoredMotion();
    this._motionGroup.innerHTML = MOTION_OPTIONS.map(
      (opt) => `<button type="button" data-value="${opt.value}" aria-pressed="${opt.value === motion}">${t(opt.key)}</button>`
    ).join('');
    this._motionGroup.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => setMotion(btn.dataset.value));
    });
  }
}

defineOnce('settings-panel', SettingsPanel);
