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
    background: var(--glass-bg-strong);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border-block-end: 1px solid var(--glass-border);
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
    background: var(--gradient-primary);
    color: var(--color-white);
    font-size: 1.1rem;
  }
`;

/**
 * <app-header></app-header>
 * Deliberately minimal: the site mark, plus (see below) a menu button that
 * opens <app-sidebar> (which holds every piece of navigation — Home,
 * Chapters, Search, Theme, Language). Nothing else lives in the permanent
 * chrome.
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
        <a class="brand" href="#top">
          <span class="mark" aria-hidden="true">${icon('atom')}</span>
          <span data-i18n="site.title"></span>
        </a>
      </div>
    `;

    /*
      Priority 3's hamburger is a real light-DOM element, appended to
      <body>, not a child inside this component's own shadow root — a
      position:fixed descendant of a stacking-context-creating ancestor
      (this :host has position:sticky + a z-index) only escapes visually,
      not in the z-index stacking order: its z-index is compared *within*
      the host's own local stacking context, so the host's z-index (100)
      still loses to app-sidebar's (300) no matter how high the button's own
      z-index goes. Living outside any shadow root — a sibling of
      <app-sidebar> in the real DOM, exactly like their backdrop divs — is
      what lets --z-fab actually win against the drawers it has to sit above.
      Styled globally in base.css as `.aurora-menu-btn`, not here.
    */
    if (!document.querySelector('.aurora-menu-btn')) {
      this._menuBtn = document.createElement('button');
      this._menuBtn.type = 'button';
      this._menuBtn.className = 'aurora-menu-btn';
      this._menuBtn.innerHTML = icon('menu');
      this._menuBtn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('toggle-sidebar'));
      });
      document.body.appendChild(this._menuBtn);
    } else {
      this._menuBtn = document.querySelector('.aurora-menu-btn');
    }

    this._updateStrings();
    this._onLangChange = () => this._updateStrings();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
    this._menuBtn?.remove();
  }

  _updateStrings() {
    this.shadowRoot.querySelector('[data-i18n="site.title"]').textContent = t('site.title');
    this._menuBtn.setAttribute('aria-label', t('action.toggleSidebar'));
  }
}

defineOnce('app-header', AppHeader);
