import { defineOnce, css } from './utils.js';
import { t } from '../lib/i18n.js';
import { toggleTheme } from '../lib/theme.js';
import { toggleLang } from '../lib/i18n.js';

const style = css`
  :host {
    display: block;
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    background: color-mix(in srgb, var(--color-bg-raised) 88%, transparent);
    backdrop-filter: blur(10px);
    border-block-end: 1px solid var(--color-border);
  }
  .bar {
    max-width: var(--layout-max-width);
    margin-inline: auto;
    padding-inline: var(--layout-gutter);
    height: var(--header-height);
    display: flex;
    align-items: center;
    gap: var(--space-5);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: 800;
    font-size: var(--fs-400);
    color: var(--color-text);
    text-decoration: none;
    white-space: nowrap;
  }
  .brand .mark {
    font-size: var(--fs-500);
  }
  nav {
    flex: 1;
    min-width: 0;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  button.icon-btn {
    appearance: none;
    border: 1px solid var(--color-border);
    background: var(--color-bg-raised);
    color: var(--color-text);
    border-radius: var(--radius-pill);
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    cursor: pointer;
    font-size: var(--fs-300);
    transition: border-color var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard);
  }
  button.icon-btn:hover {
    border-color: var(--color-primary);
    transform: translateY(-1px);
  }
  button.lang-btn {
    width: auto;
    padding-inline: var(--space-3);
    font-weight: 700;
  }
`;

class AppHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="bar">
        <a class="brand" href="#top">
          <span class="mark" aria-hidden="true">🔬</span>
          <span data-i18n="site.title"></span>
        </a>
        <nav><slot></slot></nav>
        <div class="actions">
          <button class="icon-btn lang-btn" id="lang-toggle" type="button"></button>
          <button class="icon-btn" id="theme-toggle" type="button" aria-label="">
            <span aria-hidden="true" class="theme-icon">🌗</span>
          </button>
        </div>
      </div>
    `;

    this._langBtn = this.shadowRoot.getElementById('lang-toggle');
    this._themeBtn = this.shadowRoot.getElementById('theme-toggle');

    this._langBtn.addEventListener('click', toggleLang);
    this._themeBtn.addEventListener('click', toggleTheme);

    this._updateStrings();
    this._onLangChange = () => this._updateStrings();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  _updateStrings() {
    this._langBtn.textContent = t('action.toggleLanguage');
    this._themeBtn.setAttribute('aria-label', t('action.toggleTheme'));
    // Title inside shadow DOM isn't reached by the document-level i18n scan,
    // so it's re-rendered here explicitly.
    const title = this.shadowRoot.querySelector('[data-i18n="site.title"]');
    if (title) title.textContent = t('site.title');
  }
}

defineOnce('app-header', AppHeader);
