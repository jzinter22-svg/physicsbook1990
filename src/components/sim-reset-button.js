import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: inline-block;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    appearance: none;
    border: 1px solid var(--color-border);
    background: var(--color-bg-sunken);
    color: var(--color-text);
    border-radius: var(--radius-pill);
    padding: var(--space-2) var(--space-4);
    font: inherit;
    font-weight: 700;
    font-size: var(--fs-200);
    cursor: pointer;
    transition: border-color var(--duration-fast) var(--ease-standard);
  }
  button:hover {
    border-color: var(--color-border-strong);
  }
  button svg {
    width: 1em;
    height: 1em;
  }
`;

/** <sim-reset-button></sim-reset-button> — dispatches a bubbling "sim-reset" CustomEvent on click. */
class SimResetButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style><button type="button">${icon('reset')}<span></span></button>`;
    this.shadowRoot.querySelector('button').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('sim-reset', { bubbles: true }));
    });
    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  _render() {
    this.shadowRoot.querySelector('span').textContent = t('sim.reset');
  }
}

defineOnce('sim-reset-button', SimResetButton);
