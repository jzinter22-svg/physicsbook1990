import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: none;
    padding: var(--layout-gutter);
    align-items: center;
    justify-content: center;
  }
  :host([open]) {
    display: flex;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(6, 11, 18, 0.55);
  }
  .dialog {
    position: relative;
    width: min(640px, 100%);
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    background: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    overflow: hidden;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-5);
    border-block-end: 1px solid var(--color-border);
  }
  .head h2 {
    margin: 0;
    font-size: var(--fs-500);
  }
  .close-btn {
    flex: none;
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
    overflow-y: auto;
    color: var(--color-text);
    font-size: var(--fs-300);
    line-height: var(--lh-normal);
  }
  .footer {
    padding: var(--space-4) var(--space-5);
    border-block-start: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
  }
  /* :empty never matches — the <slot> is itself always a child node of
     .footer. Visibility is toggled from JS via "slotchange" instead, and
     [hidden] needs this explicit override since .footer's own display:flex
     above would otherwise beat the UA stylesheet's [hidden] rule. */
  .footer[hidden] {
    display: none;
  }
`;

/**
 * <ui-modal heading="...">
 *   body content (slot)
 *   <span slot="footer">...optional actions...</span>
 * </ui-modal>
 * Call modalEl.open() / .close(), or toggle the `open` attribute directly.
 * General-purpose — e.g. viewing a figure or simulation at full size.
 */
export class UiModal extends HTMLElement {
  static get observedAttributes() {
    return ['heading'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="backdrop"></div>
      <div class="dialog" role="dialog" aria-modal="true">
        <div class="head">
          <h2></h2>
          <button class="close-btn" type="button">${icon('close')}</button>
        </div>
        <div class="body"><slot></slot></div>
        <div class="footer"><slot name="footer"></slot></div>
      </div>
    `;
    this._headingEl = this.shadowRoot.querySelector('h2');
    this._closeBtn = this.shadowRoot.querySelector('.close-btn');
    this._dialog = this.shadowRoot.querySelector('.dialog');
    this._footer = this.shadowRoot.querySelector('.footer');
    this._footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');

    const syncFooterVisibility = () => {
      this._footer.hidden = this._footerSlot.assignedNodes({ flatten: true }).length === 0;
    };
    this._footerSlot.addEventListener('slotchange', syncFooterVisibility);
    syncFooterVisibility();

    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this.close());
    this._closeBtn.addEventListener('click', () => this.close());

    this._onKeydown = (event) => {
      if (event.key === 'Escape' && this.hasAttribute('open')) this.close();
    };
    document.addEventListener('keydown', this._onKeydown);

    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeydown);
    document.removeEventListener('langchange', this._onLangChange);
  }

  attributeChangedCallback() {
    if (this._headingEl) this._render();
  }

  open() {
    this._previouslyFocused = document.activeElement;
    this.setAttribute('open', '');
    requestAnimationFrame(() => this._dialog.querySelector('[autofocus]')?.focus() ?? this._closeBtn.focus());
    this.dispatchEvent(new CustomEvent('modal-open'));
  }

  close() {
    this.removeAttribute('open');
    this._previouslyFocused?.focus?.();
    this.dispatchEvent(new CustomEvent('modal-close'));
  }

  _render() {
    this._headingEl.textContent = this.getAttribute('heading') ?? '';
    this._closeBtn.setAttribute('aria-label', t('action.close'));
  }
}

defineOnce('ui-modal', UiModal);
