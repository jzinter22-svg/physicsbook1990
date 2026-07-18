import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';
import { toggleTheme } from '../lib/theme.js';
import { toggleLang } from '../lib/i18n.js';

const NAV_ITEMS = [
  { href: '#top', icon: 'home', key: 'nav.home' },
  { href: '#chapters', icon: 'beaker', key: 'nav.chapters' },
];

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    position: fixed;
    inset-block: 0;
    inset-inline-start: -320px;
    width: min(300px, 85vw);
    z-index: var(--z-modal);
    background: var(--color-bg-raised);
    border-inline-end: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    transition: inset-inline-start var(--duration-normal) var(--ease-standard);
  }
  :host([open]) {
    inset-inline-start: 0;
  }
  .panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-5);
    overflow-y: auto;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .close-btn {
    appearance: none;
    border: 1px solid var(--color-border);
    background: none;
    color: var(--color-text-muted);
    border-radius: var(--radius-md);
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .close-btn:hover {
    color: var(--color-text);
    border-color: var(--color-primary);
  }
  nav, .actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .section-label {
    font-size: var(--fs-100);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    padding-inline: var(--space-4);
    margin-block-end: var(--space-1);
  }
  a, button.nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    /* Generous padding = a >=44px touch target, and calmer breathing room
       per row (Priority 1 / Priority 7 of the calm-UI rebuild). */
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    color: var(--color-text);
    text-decoration: none;
    font-weight: 600;
    font-size: var(--fs-400);
    appearance: none;
    border: none;
    background: none;
    font-family: inherit;
    text-align: start;
    cursor: pointer;
    transition: background var(--duration-fast) var(--ease-standard);
  }
  a svg, button.nav-item svg {
    flex: none;
    width: 1.2em;
    height: 1.2em;
    color: var(--color-text-muted);
  }
  a:hover, button.nav-item:hover {
    background: var(--color-bg-sunken);
  }
  a[aria-current='true'] {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }
  a[aria-current='true'] svg {
    color: var(--color-primary);
  }
  .divider {
    height: 1px;
    background: var(--color-border);
    margin-block: var(--space-2);
  }
  .more-link {
    margin-top: auto;
    font-size: var(--fs-300);
    color: var(--color-text-muted);
  }
`;

/**
 * <app-sidebar></app-sidebar>
 * The single home for navigation (Priority 2 of the calm-UI rebuild): Home,
 * Chapters, Search, Theme, and Language — nothing else. Always a
 * collapsible off-canvas drawer (opened by <app-header>'s menu button),
 * on desktop as much as mobile, so it never competes for attention with
 * the page's actual content. Anything not in that list (currently just the
 * reduced-motion preference) lives one tap away behind "More settings".
 */
class AppSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="panel">
        <div class="head">
          <button class="close-btn" id="close-btn" type="button">${icon('close')}</button>
        </div>
        <nav id="primary-nav"></nav>
        <div class="divider"></div>
        <div class="actions">
          <button class="nav-item" id="search-item" type="button"></button>
          <button class="nav-item" id="theme-item" type="button"></button>
          <button class="nav-item" id="lang-item" type="button"></button>
        </div>
        <button class="nav-item more-link" id="settings-link" type="button"></button>
      </div>
    `;

    this._nav = this.shadowRoot.getElementById('primary-nav');
    this._searchItem = this.shadowRoot.getElementById('search-item');
    this._themeItem = this.shadowRoot.getElementById('theme-item');
    this._langItem = this.shadowRoot.getElementById('lang-item');
    this._settingsLink = this.shadowRoot.getElementById('settings-link');
    this._closeBtn = this.shadowRoot.getElementById('close-btn');

    this._closeBtn.addEventListener('click', () => this.close());
    this._searchItem.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-search'));
      this.close();
    });
    this._themeItem.addEventListener('click', () => toggleTheme());
    this._langItem.addEventListener('click', () => toggleLang());
    this._settingsLink.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-settings'));
      this.close();
    });

    this._backdrop = document.createElement('div');
    this._backdrop.setAttribute('aria-hidden', 'true');
    Object.assign(this._backdrop.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(6, 11, 18, 0.4)',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity 220ms ease',
      zIndex: 'var(--z-overlay)',
    });
    this._backdrop.addEventListener('click', () => this.close());
    document.body.appendChild(this._backdrop);

    this._onToggle = () => this.toggle();
    this._onKeydown = (event) => {
      if (event.key === 'Escape' && this.hasAttribute('open')) this.close();
    };
    document.addEventListener('toggle-sidebar', this._onToggle);
    document.addEventListener('keydown', this._onKeydown);

    this._render();
    this._onLangChange = () => this._render();
    this._onThemeChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
    document.addEventListener('themechange', this._onThemeChange);

    this._setupScrollSpy();
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
    document.removeEventListener('themechange', this._onThemeChange);
    document.removeEventListener('toggle-sidebar', this._onToggle);
    document.removeEventListener('keydown', this._onKeydown);
    this._backdrop.remove();
    this._sectionObserver?.disconnect();
  }

  open() {
    this.setAttribute('open', '');
    this._backdrop.style.opacity = '1';
    this._backdrop.style.pointerEvents = 'auto';
  }

  close() {
    this.removeAttribute('open');
    this._backdrop.style.opacity = '0';
    this._backdrop.style.pointerEvents = 'none';
  }

  toggle() {
    if (this.hasAttribute('open')) this.close();
    else this.open();
  }

  _render() {
    this._nav.innerHTML = NAV_ITEMS.map(
      (item) => `<a href="${item.href}" data-href="${item.href}">${icon(item.icon)}<span>${t(item.key)}</span></a>`
    ).join('');
    this._nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => this.close());
    });

    this._searchItem.innerHTML = `${icon('search')}<span>${t('search.trigger')}</span>`;
    this._closeBtn.setAttribute('aria-label', t('action.close'));

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this._themeItem.innerHTML = `${icon(isDark ? 'sun' : 'moon')}<span>${t('action.toggleTheme')}</span>`;
    this._langItem.innerHTML = `${icon('globe')}<span>${t('action.toggleLanguage')}</span>`;
    this._settingsLink.innerHTML = `${icon('gear')}<span>${t('nav.settings')}</span>`;
  }

  _setupScrollSpy() {
    const sectionIds = NAV_ITEMS.map((item) => item.href.slice(1));
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    this._sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        const topMost = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
        this._setActive(`#${topMost.target.id}`);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((section) => this._sectionObserver.observe(section));
  }

  _setActive(href) {
    this._nav.querySelectorAll('a').forEach((link) => {
      link.setAttribute('aria-current', String(link.getAttribute('data-href') === href));
    });
  }
}

defineOnce('app-sidebar', AppSidebar);
