import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    background: var(--color-bg-raised);
    border-block-end: 1px solid var(--color-border);
  }
  .bar {
    padding-inline: var(--layout-gutter);
    height: var(--header-height);
    display: flex;
    align-items: center;
    gap: var(--space-4);
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
    background: var(--color-primary);
    color: var(--color-white);
    font-size: 1.1rem;
  }
  button.icon-btn {
    appearance: none;
    border: 1px solid var(--color-border);
    background: var(--color-bg-raised);
    color: var(--color-text);
    border-radius: var(--radius-md);
    /* 44px: comfortable touch target (Priority 7 of the calm-UI rebuild). */
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    cursor: pointer;
    font-size: 1.15rem;
    transition: border-color var(--duration-fast) var(--ease-standard);
  }
  button.icon-btn:hover {
    border-color: var(--color-primary);
  }
`;

/**
 * <app-header></app-header>
 * Deliberately minimal: a menu button that opens <app-sidebar> (which now
 * holds every piece of navigation — Home, Chapters, Search, Theme,
 * Language) plus the site mark. Nothing else lives in the permanent chrome.
 */
class AppHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="bar">
        <button class="icon-btn" id="sidebar-toggle" type="button"></button>
        <a class="brand" href="#top">
          <span class="mark" aria-hidden="true">${icon('atom')}</span>
          <span data-i18n="site.title"></span>
        </a>
      </div>
    `;

    this._sidebarBtn = this.shadowRoot.getElementById('sidebar-toggle');
    this._sidebarBtn.innerHTML = icon('menu');
    this._sidebarBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('toggle-sidebar', { bubbles: true, composed: true }));
    });

    this._updateStrings();
    this._onLangChange = () => this._updateStrings();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  _updateStrings() {
    this.shadowRoot.querySelector('[data-i18n="site.title"]').textContent = t('site.title');
    this._sidebarBtn.setAttribute('aria-label', t('action.toggleSidebar'));
  }
}

defineOnce('app-header', AppHeader);
