import { defineOnce, css } from './utils.js';
import { formatUnit } from '../engine/units.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-block-end: var(--space-2);
    font-size: var(--fs-200);
  }
  .label {
    font-weight: 600;
    color: var(--color-text);
  }
  .readout {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-primary);
    font-weight: 700;
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--color-primary);
    cursor: pointer;
  }
`;

/**
 * <sim-slider label="Mass" unit="kg" min="1" max="10" step="0.5" value="2"></sim-slider>
 * Dispatches a bubbling "sim-change" CustomEvent with `detail.value` (a
 * number) on every input, and reflects the current value in the `value`
 * property/attribute — a self-labeled, unit-aware replacement for wiring a
 * bare <input type="range"> by hand in every simulation.
 */
class SimSlider extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'unit', 'min', 'max', 'step', 'value'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="head">
        <span class="label"></span>
        <span class="readout"></span>
      </div>
      <input type="range" />
    `;
    this._input = this.shadowRoot.querySelector('input');
    this._input.addEventListener('input', () => {
      this.setAttribute('value', this._input.value);
      this.dispatchEvent(new CustomEvent('sim-change', { detail: { value: this.value }, bubbles: true }));
    });
    this._render();
  }

  attributeChangedCallback() {
    if (this._input) this._render();
  }

  get value() {
    return Number(this._input.value);
  }

  set value(v) {
    this.setAttribute('value', String(v));
  }

  _render() {
    const min = this.getAttribute('min') ?? '0';
    const max = this.getAttribute('max') ?? '10';
    const step = this.getAttribute('step') ?? '1';
    const value = this.getAttribute('value') ?? min;
    const unit = formatUnit(this.getAttribute('unit'));

    this._input.min = min;
    this._input.max = max;
    this._input.step = step;
    this._input.value = value;
    this._input.setAttribute('aria-label', this.getAttribute('label') ?? '');

    this.shadowRoot.querySelector('.label').textContent = this.getAttribute('label') ?? '';
    this.shadowRoot.querySelector('.readout').textContent = unit ? `${value} ${unit}` : value;
  }
}

defineOnce('sim-slider', SimSlider);
