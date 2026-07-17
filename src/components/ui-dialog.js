import { defineOnce, css } from './utils.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: none;
    align-items: center;
    justify-content: center;
    padding: var(--layout-gutter);
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
    width: min(420px, 100%);
    background: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    padding: var(--space-6);
  }
  h2 {
    margin: 0 0 var(--space-3);
    font-size: var(--fs-500);
  }
  .body {
    color: var(--color-text-muted);
    font-size: var(--fs-300);
    line-height: var(--lh-normal);
    margin-block-end: var(--space-5);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
  }
  /* Shadow DOM can't reach the light-DOM .btn utility classes in base.css,
     so the two action buttons are styled directly here. */
  button {
    appearance: none;
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    padding: var(--space-2) var(--space-5);
    font: inherit;
    font-weight: 700;
    font-size: var(--fs-300);
    cursor: pointer;
    transition: transform var(--duration-fast) var(--ease-standard);
  }
  button:hover {
    transform: translateY(-2px);
  }
  #cancel-btn {
    background: var(--color-bg-sunken);
    border-color: var(--color-border);
    color: var(--color-text);
  }
  #confirm-btn {
    background: var(--color-primary);
    color: var(--color-text-on-accent);
    box-shadow: var(--shadow-md);
  }
`;

/**
 * <ui-dialog heading="..." confirm-label="..." cancel-label="...">
 *   message body (slot)
 * </ui-dialog>
 * Call dialogEl.open() / .close(). Dispatches "confirm" / "cancel" (both
 * bubbling CustomEvents) and closes itself either way.
 */
export class UiDialog extends HTMLElement {
  static get observedAttributes() {
    return ['heading', 'confirm-label', 'cancel-label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="backdrop"></div>
      <div class="dialog" role="alertdialog" aria-modal="true">
        <h2></h2>
        <div class="body"><slot></slot></div>
        <div class="actions">
          <button class="btn btn--secondary" id="cancel-btn" type="button"></button>
          <button class="btn btn--primary" id="confirm-btn" type="button" autofocus></button>
        </div>
      </div>
    `;
    this._headingEl = this.shadowRoot.querySelector('h2');
    this._cancelBtn = this.shadowRoot.getElementById('cancel-btn');
    this._confirmBtn = this.shadowRoot.getElementById('confirm-btn');

    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this._resolve('cancel'));
    this._cancelBtn.addEventListener('click', () => this._resolve('cancel'));
    this._confirmBtn.addEventListener('click', () => this._resolve('confirm'));

    this._onKeydown = (event) => {
      if (event.key === 'Escape' && this.hasAttribute('open')) this._resolve('cancel');
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
    requestAnimationFrame(() => this._confirmBtn.focus());
  }

  close() {
    this.removeAttribute('open');
    this._previouslyFocused?.focus?.();
  }

  _resolve(kind) {
    this.dispatchEvent(new CustomEvent(kind, { bubbles: true }));
    this.close();
  }

  _render() {
    this._headingEl.textContent = this.getAttribute('heading') ?? '';
    this._cancelBtn.textContent = this.getAttribute('cancel-label') ?? t('action.cancel');
    this._confirmBtn.textContent = this.getAttribute('confirm-label') ?? t('action.confirm');
  }
}

defineOnce('ui-dialog', UiDialog);
