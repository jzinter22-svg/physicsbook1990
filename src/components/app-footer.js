import { defineOnce, css } from './utils.js';
import { t } from '../lib/i18n.js';

const style = css`
  :host {
    display: block;
    border-block-start: 1px solid var(--color-border);
    background: var(--color-bg-raised);
  }
  .bar {
    max-width: var(--layout-max-width);
    margin-inline: auto;
    padding: var(--space-6) var(--layout-gutter);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-3);
    color: var(--color-text-muted);
    font-size: var(--fs-200);
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .status::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-success);
  }
`;

class AppFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style><div class="bar"><span class="status"></span><span class="rights"></span></div>`;
    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  _render() {
    this.shadowRoot.querySelector('.status').textContent = t('footer.status');
    const year = new Date().getFullYear();
    this.shadowRoot.querySelector('.rights').textContent = `© ${year} · ${t('footer.rights')}`;
  }
}

defineOnce('app-footer', AppFooter);
