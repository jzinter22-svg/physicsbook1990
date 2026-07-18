import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const NAV_ITEMS = [
  { href: '#top', icon: 'home', key: 'nav.home' },
  { href: '#chapters', icon: 'beaker', key: 'nav.chapters' },
  { href: '#progress', icon: 'chart', key: 'nav.progress' },
  { href: '#about', icon: 'spark', key: 'nav.about' },
];

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    background: var(--glass-bg);
    border-inline-end: 1px solid var(--glass-border);
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  }
  .panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-5) var(--space-3);
    overflow-y: auto;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  a {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    text-decoration: none;
    font-weight: 600;
    font-size: var(--fs-300);
    transition: background var(--duration-fast) var(--ease-standard),
      color var(--duration-fast) var(--ease-standard);
  }
  a svg {
    flex: none;
    width: 1.15em;
    height: 1.15em;
  }
  a:hover {
    background: var(--color-bg-sunken);
    color: var(--color-text);
  }
  a[aria-current='true'] {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }
  button.nav-item {
    appearance: none;
    border: none;
    background: none;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .footnote {
    margin-top: auto;
    font-size: var(--fs-100);
    color: var(--color-text-muted);
    padding-inline: var(--space-4);
    line-height: var(--lh-normal);
  }

  /* Off-canvas drawer on small viewports; layout.css hands over to a static
     sticky column at >=1024px via the external .app-shell > app-sidebar rule. */
  @media (max-width: 1023px) {
    :host {
      position: fixed;
      inset-inline-start: -300px;
      top: var(--header-height);
      bottom: 0;
      width: 280px;
      /* Above the backdrop (z-overlay) regardless of DOM order — the backdrop
         is appended to document.body separately so it can dim the rest of the
         page without the sidebar's own shadow tree drawing over it. */
      z-index: var(--z-modal);
      box-shadow: var(--glass-shadow);
      border-start-end-radius: var(--radius-xl);
      border-end-end-radius: var(--radius-xl);
      transition: inset-inline-start var(--duration-glass) var(--ease-standard);
    }
    :host([open]) {
      inset-inline-start: 0;
    }
  }
`;

class AppSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="panel">
        <nav></nav>
        <button class="nav-item" id="settings-link" type="button" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);color:var(--color-text-muted);font-weight:600;font-size:var(--fs-300);"></button>
        <p class="footnote"></p>
      </div>
    `;

    this._nav = this.shadowRoot.querySelector('nav');
    this._settingsLink = this.shadowRoot.getElementById('settings-link');
    this._footnote = this.shadowRoot.querySelector('.footnote');

    this._settingsLink.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-settings'));
      this.close();
    });

    this._backdrop = document.createElement('div');
    this._backdrop.setAttribute('aria-hidden', 'true');
    Object.assign(this._backdrop.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(6, 11, 18, 0.5)',
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
    document.addEventListener('langchange', this._onLangChange);

    this._setupScrollSpy();
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
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

    this._settingsLink.innerHTML = `${icon('gear')}<span>${t('nav.settings')}</span>`;
    this._footnote.textContent = `${t('nav.chapters.soon')} · v0.2`;
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
