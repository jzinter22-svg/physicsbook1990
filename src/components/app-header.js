import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';
import { toggleTheme } from '../lib/theme.js';
import { toggleLang } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    background: var(--glass-bg-strong);
    backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturate));
    border-block-end: 1px solid var(--glass-border);
  }
  .bar {
    padding-inline: var(--layout-gutter);
    height: var(--header-height);
    display: flex;
    align-items: center;
    gap: var(--space-3);
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
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, var(--color-lab-cyan-500), var(--color-lab-violet-500));
    color: var(--color-white);
    font-size: 1.1rem;
  }
  .sidebar-toggle {
    display: grid;
  }
  @media (min-width: 1024px) {
    .sidebar-toggle {
      display: none;
    }
  }
  .search-trigger {
    flex: 1;
    max-width: 420px;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-pill);
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    color: var(--color-text-muted);
    font-size: var(--fs-200);
    cursor: pointer;
    transition: border-color var(--duration-glass) var(--ease-standard),
      box-shadow var(--duration-glass) var(--ease-standard);
  }
  .search-trigger:hover {
    border-color: var(--color-primary);
    box-shadow: var(--glow-hover);
  }
  .search-trigger .label {
    flex: 1;
    text-align: start;
    display: none;
  }
  .search-trigger kbd {
    display: none;
    font-family: var(--font-mono);
    font-size: var(--fs-100);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    padding: 1px var(--space-2);
  }
  @media (min-width: 640px) {
    .search-trigger .label,
    .search-trigger kbd {
      display: inline;
    }
  }
  .spacer {
    flex: 1;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  button.icon-btn {
    appearance: none;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    color: var(--color-text);
    border-radius: var(--radius-pill);
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    cursor: pointer;
    font-size: 1.05rem;
    transition: border-color var(--duration-glass) var(--ease-standard),
      box-shadow var(--duration-glass) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard);
  }
  button.icon-btn:hover {
    border-color: var(--color-primary);
    box-shadow: var(--glow-hover);
    transform: translateY(-1px);
  }
  button.lang-btn {
    width: auto;
    padding-inline: var(--space-3);
    font-weight: 700;
    font-size: var(--fs-200);
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
        <button class="icon-btn sidebar-toggle" id="sidebar-toggle" type="button"></button>
        <a class="brand" href="#top">
          <span class="mark" aria-hidden="true">${icon('atom')}</span>
          <span data-i18n="site.title"></span>
        </a>
        <button class="search-trigger" id="search-trigger" type="button">
          ${icon('search')}
          <span class="label"></span>
          <kbd>/</kbd>
        </button>
        <div class="spacer"></div>
        <div class="actions">
          <button class="icon-btn lang-btn" id="lang-toggle" type="button"></button>
          <button class="icon-btn" id="theme-toggle" type="button"></button>
          <button class="icon-btn" id="settings-toggle" type="button"></button>
        </div>
      </div>
    `;

    this._sidebarBtn = this.shadowRoot.getElementById('sidebar-toggle');
    this._searchBtn = this.shadowRoot.getElementById('search-trigger');
    this._langBtn = this.shadowRoot.getElementById('lang-toggle');
    this._themeBtn = this.shadowRoot.getElementById('theme-toggle');
    this._settingsBtn = this.shadowRoot.getElementById('settings-toggle');

    this._sidebarBtn.innerHTML = icon('menu');
    this._settingsBtn.innerHTML = icon('gear');

    this._sidebarBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('toggle-sidebar', { bubbles: true, composed: true }));
    });
    this._searchBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-search'));
    });
    this._settingsBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-settings'));
    });
    this._langBtn.addEventListener('click', toggleLang);
    this._themeBtn.addEventListener('click', toggleTheme);

    this._updateStrings();
    this._onLangChange = () => this._updateStrings();
    this._onThemeChange = () => this._updateStrings();
    document.addEventListener('langchange', this._onLangChange);
    document.addEventListener('themechange', this._onThemeChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
    document.removeEventListener('themechange', this._onThemeChange);
  }

  _updateStrings() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    this.shadowRoot.querySelector('[data-i18n="site.title"]').textContent = t('site.title');
    this._searchBtn.querySelector('.label').textContent = t('search.placeholder');
    this._searchBtn.setAttribute('aria-label', t('search.trigger'));
    this._langBtn.textContent = t('action.toggleLanguage');
    this._themeBtn.innerHTML = icon(isDark ? 'sun' : 'moon');
    this._themeBtn.setAttribute('aria-label', t('action.toggleTheme'));
    this._settingsBtn.setAttribute('aria-label', t('nav.settings'));
    this._sidebarBtn.setAttribute('aria-label', t('action.toggleSidebar'));
  }
}

defineOnce('app-header', AppHeader);
