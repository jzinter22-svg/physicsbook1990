import { defineOnce, css } from './utils.js';
import { t } from '../lib/i18n.js';

const DEFAULT_SPEEDS = [0.5, 1, 2, 4];

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .label {
    font-size: var(--fs-100);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
  }
  .segmented {
    display: flex;
    background: var(--color-bg-sunken);
    border-radius: var(--radius-md);
    padding: 3px;
    gap: 3px;
  }
  button {
    appearance: none;
    border: none;
    background: none;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    font: inherit;
    font-family: var(--font-mono);
    font-size: var(--fs-100);
    font-weight: 700;
    color: var(--color-text-muted);
    cursor: pointer;
  }
  button[aria-pressed='true'] {
    background: var(--color-bg-raised);
    color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }
`;

/**
 * <sim-speed-control speeds="0.5,1,2,4" value="1"></sim-speed-control>
 * Dispatches a bubbling "sim-speed-change" CustomEvent with `detail.value`
 * (a number multiplier) — pair with `engine.timeScale = event.detail.value`
 * for a SimulationEngine, or scale your own dt manually otherwise.
 */
class SimSpeedControl extends HTMLElement {
  static get observedAttributes() {
    return ['speeds', 'value'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <span class="label"></span>
      <div class="segmented"></div>
    `;
    this._group = this.shadowRoot.querySelector('.segmented');
    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  attributeChangedCallback() {
    if (this._group) this._render();
  }

  get value() {
    return Number(this.getAttribute('value') ?? 1);
  }

  set value(v) {
    this.setAttribute('value', String(v));
  }

  _speeds() {
    const raw = this.getAttribute('speeds');
    return raw ? raw.split(',').map(Number) : DEFAULT_SPEEDS;
  }

  _render() {
    this.shadowRoot.querySelector('.label').textContent = t('sim.speedControl');
    const current = this.value;

    this._group.innerHTML = this._speeds()
      .map((speed) => `<button type="button" data-speed="${speed}" aria-pressed="${speed === current}">${speed}×</button>`)
      .join('');

    this._group.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        const speed = Number(button.dataset.speed);
        this.value = speed;
        this.dispatchEvent(new CustomEvent('sim-speed-change', { detail: { value: speed }, bubbles: true }));
      });
    });
  }
}

defineOnce('sim-speed-control', SimSpeedControl);
