import { defineOnce, css } from './utils.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  ol {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    font-size: var(--fs-200);
  }
  ::slotted(a) {
    color: var(--color-text-muted);
    text-decoration: none;
  }
  ::slotted(a:hover) {
    color: var(--color-primary);
    text-decoration: underline;
  }
  ::slotted([aria-current='page']) {
    color: var(--color-text);
    font-weight: 700;
  }
`;

/**
 * <breadcrumb-nav>
 *   <a href="#">الرئيسية</a>
 *   <a href="#">الميكانيكا</a>
 *   <span aria-current="page">قوانين نيوتن</span>
 * </breadcrumb-nav>
 * Separators are injected automatically between light-DOM items.
 */
class BreadcrumbNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style><nav><ol><slot></slot></ol></nav>`;
    this._injectSeparators();

    this._nav = this.shadowRoot.querySelector('nav');
    this._updateLabel();
    this._onLangChange = () => this._updateLabel();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  _updateLabel() {
    this._nav.setAttribute('aria-label', t('breadcrumb.label'));
  }

  _injectSeparators() {
    if (this._separatorsInjected) return;
    this._separatorsInjected = true;

    // A neutral "/" separator sidesteps chevron-direction mirroring entirely —
    // it reads correctly in both RTL and LTR without any flip logic.
    const items = Array.from(this.children);
    items.slice(1).forEach((item) => {
      const sep = document.createElement('span');
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '/';
      sep.style.cssText = 'color:var(--color-border-strong);';
      this.insertBefore(sep, item);
    });
  }
}

defineOnce('breadcrumb-nav', BreadcrumbNav);
