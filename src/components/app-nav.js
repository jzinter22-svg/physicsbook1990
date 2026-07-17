import { defineOnce, css } from './utils.js';
import { t } from '../lib/i18n.js';

const style = css`
  :host {
    display: block;
  }
  ul {
    list-style: none;
    display: flex;
    align-items: center;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
  }
  a, .disabled-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    font-size: var(--fs-300);
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
  }
  a:hover {
    color: var(--color-text);
    background: var(--color-bg-sunken);
  }
  .disabled-link {
    cursor: not-allowed;
    opacity: 0.6;
  }
  .badge {
    font-size: var(--fs-100);
    font-weight: 700;
    padding: 2px var(--space-2);
    border-radius: var(--radius-pill);
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }
  @media (max-width: 767px) {
    ul { display: none; }
  }
`;

class AppNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style><ul></ul>`;
    this._list = this.shadowRoot.querySelector('ul');
    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  _render() {
    this._list.innerHTML = `
      <li><a href="#top">${t('nav.home')}</a></li>
      <li>
        <span class="disabled-link" aria-disabled="true" title="${t('nav.chapters.soon')}">
          ${t('nav.chapters')}
          <span class="badge">${t('nav.chapters.soon')}</span>
        </span>
      </li>
      <li><a href="#about">${t('nav.about')}</a></li>
    `;
  }
}

defineOnce('app-nav', AppNav);
